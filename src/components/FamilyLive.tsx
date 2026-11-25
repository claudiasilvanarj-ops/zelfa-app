import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Moon, Video, VideoOff, ShieldCheck, Volume2, Bell, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { useFamilyLive } from '@/hooks/use-family-live';
import { frameDifference, LIVE_RULES, withinCameraHours } from '@/lib/family-live';
import { describeLiveFrame } from '@/lib/family-live.functions';
import { speak, stopSpeaking } from '@/lib/voice';

export function FamilyLive() {
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<Tables<'camera_invitations'>[]>([]);
  const [email, setEmail] = useState(''), [name, setName] = useState('');
  const [hours, setHours] = useState<Record<string, { start: string; end: string }>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [night, setNight] = useState(false), [agreed, setAgreed] = useState(false), [observe, setObserve] = useState(false), [microphone, setMicrophone] = useState(false);
  const [description, setDescription] = useState(''), [describing, setDescribing] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null), remoteVideo = useRef<HTMLVideoElement>(null);
  const selectedRow = rows.find(row => row.id === selected);
  const owner = selectedRow?.owner_id === userId;
  const live = useFamilyLive(selected, owner, stream, userId);
  const describe = useServerFn(describeLiveFrame);

  async function refresh() {
    const { data, error } = await supabase.from('camera_invitations').select('*').order('created_at', { ascending: false });
    if (!error) setRows(data ?? []);
  }
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ''));
    void refresh(); const timer = window.setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (localVideo.current) localVideo.current.srcObject = stream; }, [stream, selected]);
  useEffect(() => { if (remoteVideo.current) remoteVideo.current.srcObject = live.remote; }, [live.remote]);
  useEffect(() => () => { stream?.getTracks().forEach(track => track.stop()); }, [stream]);
  useEffect(() => {
    if (selected && (!selectedRow || selectedRow.status !== 'approved' || !withinCameraHours(selectedRow.start_time, selectedRow.end_time))) stop();
  }, [rows, selected]);
  useEffect(() => {
    document.documentElement.dataset['cameraNight'] = night ? 'true' : 'false';
    if (night) { stopSpeaking(); if (document.fullscreenEnabled) void document.documentElement.requestFullscreen().catch(() => {}); }
    else if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    return () => { delete document.documentElement.dataset['cameraNight']; };
  }, [night]);
  useEffect(() => {
    if (!stream) return;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock?.request('screen').then(value => { lock = value; }).catch(() => {});
    const ended = () => stop();
    stream.getTracks().forEach(track => track.addEventListener('ended', ended));
    return () => { void lock?.release(); stream.getTracks().forEach(track => track.removeEventListener('ended', ended)); };
  }, [stream]);
  useEffect(() => {
    if (!stream || !observe || !selected || !owner) return;
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    let previous: Uint8ClampedArray | null = null, lastMovement = Date.now(), lastAlert = 0, absenceSent = false;
    const timer = window.setInterval(() => {
      const video = localVideo.current;
      if (!ctx || !video?.videoWidth) return;
      ctx.drawImage(video, 0, 0, 64, 48);
      const pixels = ctx.getImageData(0, 0, 64, 48).data;
      const visible = pixels.filter((_, i) => i % 4 === 0).some(value => value > 25);
      if (!visible) { previous = null; lastMovement = Date.now(); return; }
      if (previous && frameDifference(previous, pixels) > 12) {
        lastMovement = Date.now(); absenceSent = false;
        if (Date.now() - lastAlert > LIVE_RULES.alertCooldownSeconds * 1000) { lastAlert = Date.now(); void live.alert('Mudança na imagem detectada. Pode ser movimento ou iluminação; confira com seu familiar.'); }
      }
      if (!absenceSent && Date.now() - lastMovement > LIVE_RULES.noMovementMinutes * 60000) { absenceSent = true; void live.alert('15 minutos sem variação perceptível na imagem. Isso não indica um problema de saúde; confira com seu familiar.'); }
      previous = pixels;
    }, 2000);
    return () => clearInterval(timer);
  }, [stream, observe, selected, owner]);
  useEffect(() => {
    if (!stream?.getAudioTracks().length || !observe || !owner) return;
    const audio = new AudioContext(); const source = audio.createMediaStreamSource(stream); const analyser = audio.createAnalyser();
    source.connect(analyser); const samples = new Uint8Array(analyser.fftSize); let last = 0;
    const timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      if (samples.some(value => Math.abs(value - 128) > 45) && Date.now() - last > 60000) { last = Date.now(); void live.alert('Som forte percebido. Pode ser uma voz ou ruído; confira com seu familiar.'); }
    }, 1000);
    return () => { clearInterval(timer); source.disconnect(); void audio.close(); };
  }, [stream, observe, owner]);

  function stop() { stream?.getTracks().forEach(track => track.stop()); setStream(null); setSelected(null); setNight(false); }
  async function start(row: Tables<'camera_invitations'>) {
    if (!withinCameraHours(row.start_time, row.end_time)) { toast.error('Este horário não foi autorizado.'); return; }
    const { data: allowed } = await supabase.rpc('camera_allowed', { invitation: row.id });
    if (!allowed) { toast.error('A autorização não está ativa.'); return; }
    stop();
    if (row.owner_id === userId) {
      if (!agreed) { toast.error('Confirme sua permissão para ligar a câmera.'); return; }
      try { const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: microphone }); setStream(media); }
      catch { toast.error('Não consegui abrir a câmera. Confira a permissão do aparelho.'); return; }
    }
    setSelected(row.id);
  }
  async function decide(row: Tables<'camera_invitations'>, decision: string) {
    const h = hours[row.id] ?? { start: row.start_time.slice(0,5), end: row.end_time.slice(0,5) };
    const { error } = await supabase.rpc('camera_decide', { invitation: row.id, decision, allowed_start: h.start, allowed_end: h.end });
    if (error) toast.error('Não consegui atualizar a autorização.');
    else { if (selected === row.id) stop(); await refresh(); }
  }
  async function readImage() {
    const video = localVideo.current;
    if (!selected || !video?.videoWidth || night) return;
    setDescribing(true);
    try {
      const canvas = document.createElement('canvas'); const scale = Math.min(1, 640/video.videoWidth); canvas.width = video.videoWidth*scale; canvas.height = video.videoHeight*scale;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      const text = await describe({ data: { invitation: selected, image: canvas.toDataURL('image/jpeg',0.65) } }); setDescription(text);
      if (document.documentElement.dataset['cameraNight'] !== 'true') speak(text);
    } catch { toast.error('Não consegui descrever a imagem agora.'); } finally { setDescribing(false); }
  }
  const field = 'min-w-0 w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-lg';
  return <section className="mb-6 space-y-5 border-b border-border pb-6">
    <h2 className="text-3xl font-bold">Família Conectada · Ao vivo</h2>
    <p className="text-muted-foreground">Somente com sua autorização. Sem gravação. Horários de Brasília.</p>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault(); const { error } = await supabase.from('camera_invitations').insert({ viewer_name: name.trim(), owner_email: email.trim().toLowerCase() });
      if (error) toast.error('Não consegui enviar. Use o e-mail de outra pessoa.'); else { toast.success('Convite enviado para aprovação no aparelho do seu familiar.'); setEmail(''); await refresh(); }
    }}>
      <input aria-label="Seu nome no convite" className={field} placeholder="Seu nome" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      <input aria-label="E-mail do familiar que autoriza" className={field} placeholder="E-mail de quem autoriza a câmera" type="email" required maxLength={255} value={email} onChange={event => setEmail(event.target.value)} />
      <Button className="h-auto whitespace-normal py-3 text-lg sm:col-span-2"><Send />Enviar convite para acompanhar</Button>
    </form>
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-muted-foreground">Nenhum convite por enquanto.</p>}
      {rows.map(row => {
        const mine = row.viewer_id === userId;
        const h = hours[row.id] ?? { start: row.start_time.slice(0,5), end: row.end_time.slice(0,5) };
        return <article key={row.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="break-words text-xl font-bold">{mine ? `Acompanhar ${row.owner_email}` : `${row.viewer_name} quer acompanhar sua câmera`}</h3>
          <p className="text-muted-foreground">{row.status === 'pending' && mine ? 'Aguardando autorização do familiar' : ({ pending: 'Aguardando sua autorização', approved: 'Autorizado', declined: 'Convite recusado', revoked: 'Autorização revogada' } as Record<string,string>)[row.status]}{row.status === 'approved' && ` · ${row.start_time === row.end_time ? 'Todos os horários' : `${row.start_time.slice(0,5)} às ${row.end_time.slice(0,5)}`}`}</p>
          {!mine && ['pending','approved'].includes(row.status) && <>
            <div className="grid grid-cols-2 gap-3">
              <label>Das<input aria-label={`Horário inicial para ${row.viewer_name}`} type="time" className={field} value={h.start} onChange={event => setHours(old => ({ ...old, [row.id]: { ...h, start: event.target.value } }))} /></label>
              <label>Até<input aria-label={`Horário final para ${row.viewer_name}`} type="time" className={field} value={h.end} onChange={event => setHours(old => ({ ...old, [row.id]: { ...h, end: event.target.value } }))} /></label>
            </div>
            <p className="text-sm text-muted-foreground">Horários iguais permitem qualquer horário, somente enquanto você mantém a câmera ligada.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void decide(row,'approved')} className="h-auto whitespace-normal py-3 text-lg"><ShieldCheck />{row.status === 'pending' ? 'Autorizar no meu aparelho' : 'Salvar horários'}</Button>
              <Button variant="outline" onClick={() => void decide(row, row.status === 'pending' ? 'declined' : 'revoked')} className="h-auto py-3">{row.status === 'pending' ? 'Recusar' : 'Revogar agora'}</Button>
            </div>
          </>}
          {row.status === 'approved' && <Button onClick={() => void start(row)} disabled={!mine && !agreed} className="h-auto whitespace-normal py-3 text-lg"><Video />{mine ? 'Assistir ao vivo' : 'Ligar e compartilhar câmera'}</Button>}
        </article>;
      })}
    </div>
    <div className="space-y-3 text-lg">
      <label className="flex gap-3"><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} className="h-6 w-6 shrink-0" />Permito transmitir minha câmera para a pessoa que autorizei, sem gravação.</label>
      <label className="flex gap-3"><input type="checkbox" disabled={Boolean(stream)} checked={microphone} onChange={event => setMicrophone(event.target.checked)} className="h-6 w-6 shrink-0" />Permitir áudio e percepção de sons fortes</label>
      <label className="flex gap-3"><input type="checkbox" checked={observe} onChange={event => setObserve(event.target.checked)} className="h-6 w-6 shrink-0" />Alertas auxiliares de mudança e 15 minutos sem movimento perceptível</label>
    </div>
    {selected && <div className="space-y-3">
      <p role="status" className="sticky top-16 z-20 rounded-xl bg-card p-3 font-bold text-live">{stream ? 'CÂMERA ATIVA — sem gravação' : 'Conexão familiar'} · {live.status}</p>
      <video ref={localVideo} autoPlay playsInline muted className={`aspect-video w-full rounded-xl bg-muted object-contain ${owner ? '' : 'hidden'}`} />
      <video ref={remoteVideo} autoPlay playsInline muted className={`aspect-video w-full rounded-xl bg-muted object-contain ${owner ? 'hidden' : ''}`} />
      {!owner && live.remote?.getAudioTracks().length ? <Button variant="outline" onClick={() => { if (remoteVideo.current) { remoteVideo.current.muted = false; void remoteVideo.current.play(); } }}><Volume2 />Ouvir áudio autorizado</Button> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" onClick={stop} className="h-auto py-3"><VideoOff />Encerrar</Button>
        {owner && <><Button variant="secondary" onClick={() => setNight(true)} className="h-auto py-3"><Moon />Modo noturno</Button><Button variant="outline" disabled={describing} onClick={() => void readImage()} className="h-auto py-3"><Volume2 />{describing ? 'Observando…' : 'ZELFA, o que você vê?'}</Button><Button variant="outline" onClick={() => void live.alert('Seu familiar chamou pela ZELFA. Entre em contato com ele.')} className="h-auto py-3"><Bell />Chamar familiar</Button></>}
      </div>
      {description && <p>{description}</p>}
      {owner && <p className="text-sm text-muted-foreground">Ao pedir uma descrição, uma imagem é enviada à inteligência artificial para análise, sem salvar a foto na conversa.</p>}
      {live.alerts.map((text,index) => <p role="alert" key={index} className="rounded-xl bg-secondary p-3">🔔 {text}</p>)}
    </div>}
    <p className="text-sm text-muted-foreground">Mantenha o app aberto nos dois aparelhos. Tela bloqueada, falta de internet ou pouca luz podem interromper a imagem e os alertas. Não identifica se alguém acordou ou precisa de ajuda e não substitui acompanhamento humano. Em emergência, ligue 192. Algumas redes podem impedir a conexão.</p>
    {night && <div className="fixed inset-0 z-50 flex flex-col items-center justify-end gap-5 bg-camera-night p-8 text-camera-night-foreground">
      <span role="status" className="text-sm">Câmera ativa · sem gravação</span>
      <Button variant="ghost" className="h-auto whitespace-normal py-4 text-camera-night-foreground" onClick={() => setNight(false)}>Voltar à tela</Button>
      <Button variant="ghost" className="h-auto py-4 text-camera-night-foreground" onClick={stop}>Desligar câmera</Button>
    </div>}
  </section>;
}