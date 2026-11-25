import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type Signal = { session: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; text?: string };

export function useFamilyLive(invitation: string | null, owner: boolean, stream: MediaStream | null, userId: string) {
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState('Desconectado');
  const [alerts, setAlerts] = useState<string[]>([]);
  const peer = useRef<RTCPeerConnection | null>(null);
  const session = useRef('');
  const sendRef = useRef<(kind: string, payload: Signal) => Promise<void>>(async () => {});

  useEffect(() => {
    if (!invitation || (owner && !stream)) return;
    let disposed = false, polling = false;
    let cursor = new Date().toISOString();
    const seen = new Set<string>();
    let candidates: RTCIceCandidateInit[] = [];
    const send = async (kind: string, payload: Signal) => {
      if (disposed) return;
      const { error } = await supabase.from('camera_signals').insert({ invitation_id: invitation, kind, payload: payload as unknown as Json });
      if (error) { peer.current?.close(); setRemote(null); setStatus('Sem autorização ou fora do horário'); }
    };
    sendRef.current = send;
    const connect = () => {
      peer.current?.close();
      candidates = [];
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peer.current = pc;
      if (owner && stream) stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = event => { if (event.candidate) void send('ice', { session: session.current, candidate: event.candidate.toJSON() }); };
      pc.ontrack = event => { if (!disposed) setRemote(event.streams[0] ?? new MediaStream([event.track])); };
      pc.onconnectionstatechange = () => {
        if (disposed) return;
        setStatus(pc.connectionState === 'connected' ? 'Ao vivo' : pc.connectionState === 'failed' ? 'Não foi possível conectar nesta rede' : 'Conectando…');
        if (['failed','closed','disconnected'].includes(pc.connectionState)) setRemote(null);
      };
      return pc;
    };
    setRemote(null); setAlerts([]); setStatus(owner ? 'Aguardando familiar' : 'Solicitando imagem…');
    if (!owner) { session.current = crypto.randomUUID(); connect(); void send('request', { session: session.current }); }
    const poll = async () => {
      if (disposed || polling) return;
      polling = true;
      try {
        const { data: allowed, error: permissionError } = await supabase.rpc('camera_allowed', { invitation });
        if (!allowed || permissionError) { peer.current?.close(); setRemote(null); setStatus('Autorização encerrada ou fora do horário'); return; }
        const { data, error } = await supabase.from('camera_signals').select('*').eq('invitation_id', invitation).gte('created_at', cursor).order('created_at').limit(100);
        if (error) throw error;
        for (const row of data ?? []) {
          if (disposed) return;
          cursor = row.created_at;
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          if (row.sender_id === userId) continue;
          const value = row.payload as unknown as Signal;
          if (!value || typeof value.session !== 'string') continue;
          if (owner && row.kind === 'request') {
            session.current = value.session;
            const pc = connect();
            await pc.setLocalDescription(await pc.createOffer());
            if (pc.localDescription) await send('offer', { session: session.current, sdp: pc.localDescription.toJSON() });
          } else if (value.session === session.current) {
            const pc = peer.current;
            if (row.kind === 'stop') { pc?.close(); setRemote(null); setStatus('Transmissão encerrada'); }
            if (row.kind === 'alert' && value.text) {
              setAlerts(old => [value.text ?? '', ...old].slice(0, 10));
              if (!owner && 'Notification' in window && Notification.permission === 'granted') new Notification('ZELFA · Família Conectada', { body: value.text, icon: '/icon-192.png' });
            }
            if (!pc || pc.signalingState === 'closed') continue;
            if (row.kind === 'offer' && !owner && value.sdp) {
              await pc.setRemoteDescription(value.sdp);
              await pc.setLocalDescription(await pc.createAnswer());
              if (pc.localDescription) await send('answer', { session: session.current, sdp: pc.localDescription.toJSON() });
            }
            if (row.kind === 'answer' && owner && value.sdp) await pc.setRemoteDescription(value.sdp);
            if (row.kind === 'ice' && value.candidate) candidates.push(value.candidate);
            if (pc.remoteDescription) { for (const candidate of candidates) await pc.addIceCandidate(candidate); candidates = []; }
          }
        }
      } catch { if (!disposed) { peer.current?.close(); setRemote(null); setStatus('Conexão interrompida; verifique a internet'); } }
      finally { polling = false; }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 1500);
    return () => {
      void supabase.from('camera_signals').insert({ invitation_id: invitation, kind: 'stop', payload: { session: session.current } });
      disposed = true; clearInterval(timer); peer.current?.close(); peer.current = null; sendRef.current = async () => {};
    };
  }, [invitation, owner, stream, userId]);

  return { remote, status, alerts, alert: (text: string) => sendRef.current('alert', { session: session.current, text }) };
}