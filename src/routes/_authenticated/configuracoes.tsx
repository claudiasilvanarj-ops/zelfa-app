import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getVoiceSettings, setVoiceSettings, speak } from "@/lib/voice";
import { DEFAULT_SETTINGS, GREETING, type Speed, type VoiceSettings } from "@/lib/voice-rules";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Configurações da voz — ZELFA" },
      { name: "description", content: "Ligue ou desligue a voz da ZELFA e escolha a velocidade da fala." },
      { property: "og:title", content: "Configurações da voz — ZELFA" },
      { property: "og:description", content: "Voz da Professora Quel: ligada ou desligada, lenta, normal ou rápida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const [s, setS] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  useEffect(() => setS(getVoiceSettings()), []);
  const update = (n: VoiceSettings) => { setS(n); setVoiceSettings(n); };
  const opt = (on: boolean) => `h-16 flex-1 rounded-3xl border-2 text-lg font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`;

  return (
    <AppShell title="⚙️ Configurações">
      <h2 className="text-xl font-bold">Voz da ZELFA</h2>
      <div className="mt-2 flex gap-3">
        <button className={opt(s.enabled)} aria-pressed={s.enabled} onClick={() => update({ ...s, enabled: true })}>🔊 Ligada</button>
        <button className={opt(!s.enabled)} aria-pressed={!s.enabled} onClick={() => update({ ...s, enabled: false })}>🔇 Desligada</button>
      </div>
      <h2 className="mt-6 text-xl font-bold">Velocidade da fala</h2>
      <div className="mt-2 flex gap-3">
        {([["lenta", "Lenta"], ["normal", "Normal"], ["rapida", "Rápida"]] as [Speed, string][]).map(([k, l]) => (
          <button key={k} className={opt(s.speed === k)} aria-pressed={s.speed === k} onClick={() => update({ ...s, speed: k })}>{l}</button>
        ))}
      </div>
      <button className="mt-6 h-14 w-full rounded-full bg-accent text-lg font-semibold text-accent-foreground disabled:opacity-50" disabled={!s.enabled} onClick={() => speak(GREETING)}>🔊 Testar a voz da Quel</button>
      <p className="mt-4 text-muted-foreground">A ZELFA fala só o essencial: a saudação, a apresentação das receitas e o modo de preparo. Listas e cardápios ficam só escritos.</p>
    </AppShell>
  );
}
