import { useEffect, useState } from "react";
import { toast } from "sonner";
import { speak } from "@/lib/voice";
import { TimerControls } from "@/components/TimerControls";
import { alertPlan, alertText, leftOf, onTimerAlert, useTimers } from "@/lib/timers";

/** Faixa fixa "Cozinhando agora" + avisos (toast e voz da ZELFA no fim). */
export function CookingNow() {
  const timers = useTimers();
  const [open, setOpen] = useState(false);
  useEffect(() => onTimerAlert((t, kind) => {
    const text = alertText(kind, t.recipe);
    toast(text, { duration: kind === "fim" ? 15000 : 6000 });
    if (kind === "fim") speak("Está pronto! Vem ver como ficou!");
  }), []);
  if (!timers.length) return null;
  const now = Date.now();
  const nextIn = Math.min(...timers.map((t) => {
    const elapsed = t.total - leftOf(t, now);
    const a = alertPlan(t.total).find((p) => p.at > elapsed);
    return a ? a.at - elapsed : Infinity;
  }));
  const label = `⏱️ ${timers.length} ${timers.length === 1 ? "prato" : "pratos"} na cozinha${Number.isFinite(nextIn) ? ` · próximo aviso em ${nextIn >= 60 ? `${Math.ceil(nextIn / 60)} min` : `${Math.ceil(nextIn)} s`}` : ""}`;
  return (
    <div className="border-t border-gold bg-primary text-primary-foreground">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mx-auto block w-full max-w-3xl px-4 py-2 text-left text-lg font-bold">{label}</button>
      {open && (
        <ul className="mx-auto max-h-[60vh] max-w-3xl space-y-2 overflow-y-auto px-4 pb-3">
          {timers.map((t) => <li key={t.id}><TimerControls t={t} showName /></li>)}
        </ul>
      )}
    </div>
  );
}
