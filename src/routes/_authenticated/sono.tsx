import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { playAmbient, type SoundKind } from "@/lib/ambient";

export const Route = createFileRoute("/_authenticated/sono")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Sono — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Sons relaxantes, rotina de sono e dicas de descanso." },
      { property: "og:title", content: "Sono — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Durma melhor com a ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sono,
});

const SOUNDS: { k: SoundKind; e: string; t: string }[] = [
  { k: "chuva", e: "🌧️", t: "Chuva" },
  { k: "mar", e: "🌊", t: "Mar" },
  { k: "vento", e: "🍃", t: "Vento na natureza" },
  { k: "lareira", e: "🔥", t: "Lareira" },
];

const TIPS = [
  "Desligue as telas 30 minutos antes de deitar.",
  "Tente dormir e acordar sempre no mesmo horário.",
  "Quarto escurinho, silencioso e fresquinho ajuda muito.",
  "Evite café, chá preto e refrigerante depois das 16h.",
  "Um banho morno e uma respiração lenta acalmam o corpo.",
  "Anote as preocupações num papel antes de deitar — amanhã você resolve.",
];

function Sono() {
  const [playing, setPlaying] = useState<SoundKind | null>(null);
  const [vol, setVol] = useState(0.5);
  const [timer, setTimer] = useState(0);
  const ref = useRef<ReturnType<typeof playAmbient> | null>(null);

  useEffect(() => () => ref.current?.stop(), []);
  useEffect(() => { ref.current?.setVolume(vol); }, [vol]);
  useEffect(() => {
    if (!timer || !playing) return;
    const id = setTimeout(() => toggle(playing), timer * 60e3);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, playing]);

  function toggle(k: SoundKind) {
    ref.current?.stop();
    ref.current = null;
    if (playing === k) { setPlaying(null); return; }
    ref.current = playAmbient(k, vol);
    setPlaying(k);
  }

  return (
    <AppShell title="😴 Sono">
      <p className="text-xl">Escolha um som e deixe tocar enquanto você relaxa. 💛</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {SOUNDS.map((s) => (
          <button key={s.k} onClick={() => toggle(s.k)} className={`rounded-[1.75rem] p-6 text-left shadow-soft ${playing === s.k ? "bg-primary text-primary-foreground" : "bg-tile-5"}`}>
            <div className="text-5xl">{s.e}</div>
            <div className="mt-2 font-display text-xl font-semibold">{s.t}</div>
            <div className="text-sm opacity-80">{playing === s.k ? "Tocando — toque para parar" : "Toque para ouvir"}</div>
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <label className="block text-lg font-semibold">Volume</label>
        <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => setVol(Number(e.target.value))} className="w-full accent-primary" />
        <label className="mt-4 block text-lg font-semibold">Desligar sozinho depois de</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 15, 30, 60].map((m) => (
            <button key={m} onClick={() => setTimer(m)} className={`rounded-full px-5 py-3 font-bold ${timer === m ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {m === 0 ? "Não desligar" : `${m} min`}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="text-2xl font-bold">Dicas para um sono gostoso</h2>
        <ul className="mt-3 space-y-2 text-lg">
          {TIPS.map((t) => <li key={t}>🌙 {t}</li>)}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/respiracao" className="rounded-full bg-secondary px-5 py-3 font-bold">Respirar antes de dormir</Link>
          <Link to="/conversa" search={{ modo: "conversa", iniciar: "ZELFA, me ajuda a montar uma rotina de sono gostosa?" }} className="rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground">Montar minha rotina com a ZELFA</Link>
        </div>
      </div>
    </AppShell>
  );
}
