import { useState } from "react";
import { DishPhotoButton } from "@/components/DishPhotoButton";
import { addMinutes, alertText, cancelTimer, completeNow, finishTimer, formatClock, leftOf, setLeftMinutes, setTotalMinutes, togglePause, type Timer } from "@/lib/timers";

const btn = "rounded-full bg-primary-foreground/15 px-3 py-1.5 font-bold";

/** Um cronômetro com todos os controles — usado no passo da receita e no painel "Cozinhando agora". */
export function TimerControls({ t, category = "prato", showName }: { t: Timer; category?: string; showName?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [min, setMin] = useState("");
  if (t.done) {
    return (
      <div className="rounded-2xl border-2 border-gold bg-secondary p-3 text-secondary-foreground">
        <p className="text-lg font-bold">{t.early ? "Que ótimo que ficou pronto! 🍳" : alertText("fim", t.recipe)}</p>
        {showName && t.early && <p className="text-sm">{t.recipe}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <DishPhotoButton title={t.recipe} category={category} onDone={() => finishTimer(t.id)} label="📸 Fotografou seu prato?" />
          <button type="button" onClick={() => finishTimer(t.id)} className="rounded-full bg-accent px-4 py-2 font-bold text-accent-foreground">OK 💛</button>
        </div>
      </div>
    );
  }
  const paused = t.pausedLeft != null;
  const n = Number(min.replace(",", "."));
  const valid = n > 0 && n <= 600;
  return (
    <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
      {showName && <p className="truncate text-sm opacity-80">{t.recipe} — {t.step.slice(0, 50)}</p>}
      <p className="font-display text-3xl tabular-nums">{formatClock(leftOf(t))}{paused && <span className="ml-2 text-base">⏸️ pausado</span>}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button type="button" className={btn} onClick={() => { setMin(String(Math.ceil(Math.max(0, leftOf(t)) / 60))); setEdit((e) => !e); }}>✏️ AJUSTAR TEMPO</button>
        <button type="button" className={btn} onClick={() => addMinutes(t.id, 5)}>⏱️ +5 MIN</button>
        <button type="button" className={btn} onClick={() => togglePause(t.id)}>{paused ? "▶️ RETOMAR" : "⏸️ PAUSAR"}</button>
        <button type="button" className={btn} onClick={() => completeNow(t.id)}>✅ CONCLUÍ AGORA</button>
        <button type="button" className={btn} onClick={() => cancelTimer(t.id)}>❌ CANCELAR</button>
      </div>
      {edit && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <input type="number" inputMode="numeric" min={1} max={600} value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minutos" className="w-20 rounded-xl bg-card px-2 py-1 text-lg text-card-foreground" /> min
          </label>
          <button type="button" disabled={!valid} className={btn} onClick={() => { setLeftMinutes(t.id, n); setEdit(false); }}>Faltam esses minutos</button>
          <button type="button" disabled={!valid} className={btn} onClick={() => { setTotalMinutes(t.id, n); setEdit(false); }}>Tempo total ({Math.round(t.total / 60)} → {valid ? n : "?"} min)</button>
        </div>
      )}
    </div>
  );
}
