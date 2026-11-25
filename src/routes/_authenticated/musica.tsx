import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PLAYLISTS, playPlaylist, type Playlist } from "@/lib/ambient";
import { Button } from "@/components/ui/button";
import { MusicExternalLinks } from "@/components/MusicExternalLinks";
import { stopSpeaking } from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/musica")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Música & Canto — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Playlists calmas e alegres, karaokê e cantigas com a ZELFA." },
      { property: "og:title", content: "Música & Canto — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "A ZELFA toca e canta com você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Musica,
});

const SINGS = [
  { e: "🎠", t: "Cantigas de roda", s: "ZELFA, canta uma cantiga de roda para as crianças? Pode ser Ciranda, Cirandinha." },
  { e: "🌙", t: "Para ninar", s: "ZELFA, canta uma canção suave de ninar para acalmar?" },
  { e: "🎉", t: "Para animar o dia", s: "ZELFA, canta uma música bem alegre para animar meu dia?" },
  { e: "🎂", t: "Festa de aniversário", s: "ZELFA, crie uma canção de aniversário totalmente original e personalizada, sem copiar músicas existentes. Pergunte o nome do aniversariante." },
  { e: "🌽", t: "Folclore brasileiro", s: "ZELFA, vamos cantar a versão tradicional de domínio público de Peixe Vivo?" },
  { e: "🎤", t: "Karaokê", s: "ZELFA, quero fazer karaokê! Vamos escolher uma cantiga de domínio público, criar uma canção original por tema ou adaptar versos que eu mesma escrevi ou ditei? Para músicas famosas, quero abrir no app externo e receber encorajamento, sem letra nem melodia aqui." },
];

function Musica() {
  const [current, setCurrent] = useState<Playlist | null>(null);
  const [vol, setVol] = useState(0.4);
  const [ask, setAsk] = useState("");
  const ref = useRef<ReturnType<typeof playPlaylist> | null>(null);
  const navigate = useNavigate();
  useEffect(() => () => ref.current?.stop(), []);
  useEffect(() => { ref.current?.setVolume(vol); }, [vol]);

  function toggle(p: Playlist) {
    ref.current?.stop();
    ref.current = null;
    if (current?.id === p.id) { setCurrent(null); return; }
    ref.current = playPlaylist(p, vol);
    setCurrent(p);
  }

  function stopForExternal() {
    ref.current?.stop(); ref.current = null; setCurrent(null); stopSpeaking();
  }

  return (
    <AppShell title="🎵 Música & Canto">
      <h2 className="text-2xl font-bold">A ZELFA canta com você 🎤</h2>
      <p className="text-lg text-muted-foreground">Cantigas de domínio público e versos originais, com carinho.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SINGS.map((s) => (
          <Link key={s.t} to="/conversa" search={{ modo: "canto", iniciar: s.s }} className="rounded-[1.75rem] bg-tile-1 p-5 shadow-soft">
            <div className="text-4xl">{s.e}</div>
            <div className="mt-1 font-display text-lg font-semibold">{s.t}</div>
          </Link>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (ask.trim()) navigate({ to: "/conversa", search: { modo: "canto", iniciar: `ZELFA, quero ouvir: ${ask.trim()}` } });
        }}
      >
        <input aria-label="Música ou canção personalizada" maxLength={300} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Música, nome ou ocasião..." className="min-w-0 flex-1 rounded-full border-2 border-input bg-card px-5 py-4 text-lg" />
        <Button className="h-auto rounded-full px-6 font-bold">Pedir</Button>
      </form>
      <div className="mt-3"><MusicExternalLinks query={ask} beforeOpen={stopForExternal} /></div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="secondary" className="h-auto whitespace-normal py-3 text-lg">
          <Link to="/conversa" search={{ modo: "canto", iniciar: "ZELFA, quero criar uma canção totalmente original para o karaokê. Pergunte o tema, a ocasião e o estilo." }}>Criar minha canção</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto whitespace-normal py-3 text-lg">
          <Link to="/conversa" search={{ modo: "canto", iniciar: "ZELFA, quero transformar versos escritos ou ditados por mim em uma canção original para cantar junto. Peça os versos e confirme minha autoria antes de adaptar." }}>Usar meus versos</Link>
        </Button>
      </div>

      <h2 className="mt-8 text-2xl font-bold">Playlists instrumentais</h2>
      <p className="text-lg text-muted-foreground">Músicas suaves tocadas aqui no aparelho, para acompanhar seu dia.</p>
      <div className="mt-3 space-y-3">
        {PLAYLISTS.map((p) => (
          <button key={p.id} onClick={() => toggle(p)} className={`flex w-full items-center gap-4 rounded-[1.75rem] p-5 text-left shadow-soft ${current?.id === p.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            <span className="rounded-full bg-gold p-3 text-gold-foreground">{current?.id === p.id ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}</span>
            <span><b className="block text-xl">{p.name}</b><span className="opacity-80">{p.desc}</span></span>
          </button>
        ))}
      </div>
      <label className="mt-4 block text-lg font-semibold">Volume</label>
      <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => setVol(Number(e.target.value))} className="w-full accent-primary" />
    </AppShell>
  );
}
