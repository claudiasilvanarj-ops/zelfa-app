import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { speak, stopSpeaking } from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/respiracao")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Respiração — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Exercícios guiados de respiração para calma, ansiedade e energia." },
      { property: "og:title", content: "Respiração — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Respire comigo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Respiracao,
});

type Step = { label: string; secs: number; scale: number };
const EXERCISES: { id: string; e: string; t: string; d: string; steps: Step[] }[] = [
  { id: "calma", e: "🌸", t: "Calma", d: "Respiração 4-7-8", steps: [{ label: "Inspire pelo nariz", secs: 4, scale: 1 }, { label: "Segure", secs: 7, scale: 1 }, { label: "Solte devagar pela boca", secs: 8, scale: 0.55 }] },
  { id: "ansiedade", e: "🫶", t: "Ansiedade", d: "Respiração da caixa 4-4-4-4", steps: [{ label: "Inspire", secs: 4, scale: 1 }, { label: "Segure", secs: 4, scale: 1 }, { label: "Solte", secs: 4, scale: 0.55 }, { label: "Descanse", secs: 4, scale: 0.55 }] },
  { id: "energia", e: "☀️", t: "Energia", d: "Ritmo animado 2-2", steps: [{ label: "Inspire forte", secs: 2, scale: 1 }, { label: "Solte com força", secs: 2, scale: 0.55 }] },
];

function Respiracao() {
  const [ex, setEx] = useState<(typeof EXERCISES)[number] | null>(null);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [voice, setVoice] = useState(true);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(() => {
    if (!ex) return;
    const step = ex.steps[i]!;
    setLeft(step.secs);
    if (voiceRef.current) speak(step.label, { rate: 0.85 });
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    const next = setTimeout(() => {
      const ni = (i + 1) % ex.steps.length;
      if (ni === 0) setCycles((c) => c + 1);
      setI(ni);
    }, step.secs * 1000);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [ex, i, cycles]);

  useEffect(() => () => stopSpeaking(), []);

  if (!ex)
    return (
      <AppShell title="🌬️ Respiração">
        <p className="text-xl">Vamos respirar? Escolha como você quer se sentir:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {EXERCISES.map((e) => (
            <button key={e.id} onClick={() => { setEx(e); setI(0); setCycles(0); }} className="rounded-[1.75rem] bg-tile-2 p-6 text-left shadow-soft">
              <div className="text-5xl">{e.e}</div>
              <div className="mt-2 font-display text-2xl font-semibold">{e.t}</div>
              <div className="text-foreground/75">{e.d}</div>
            </button>
          ))}
        </div>
      </AppShell>
    );

  const step = ex.steps[i]!;
  return (
    <AppShell title={`🌬️ ${ex.t}`}>
      <div className="flex flex-col items-center py-6 text-center">
        <div className="relative flex h-72 w-72 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-warm shadow-soft"
            style={{ transform: `scale(${step.scale})`, transition: `transform ${step.secs}s ease-in-out` }}
          />
          <div className="relative">
            <div className="font-display text-3xl font-semibold">{step.label}</div>
            <div className="mt-2 text-6xl font-bold text-primary">{left}</div>
          </div>
        </div>
        <p className="mt-6 text-xl">Ciclos completos: <b>{cycles}</b> {cycles >= 4 && "— Isso! Você é demais! 🎉"}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => setVoice(!voice)} className="rounded-full bg-secondary px-6 py-3 text-lg font-bold">{voice ? "🔊 Com voz" : "🔇 Sem voz"}</button>
          <button onClick={() => { setEx(null); stopSpeaking(); }} className="rounded-full bg-primary px-6 py-3 text-lg font-bold text-primary-foreground">Terminar</button>
        </div>
      </div>
    </AppShell>
  );
}
