import { TimerControls } from "@/components/TimerControls";
import { formatClock, startTimer, useTimers } from "@/lib/timers";

export function StepTimer({ recipe, category, step, seconds }: { recipe: string; category: string; step: string; seconds: number }) {
  const timers = useTimers().filter((t) => t.recipe === recipe && t.step === step);
  return (
    <div className="mt-2 space-y-2">
      {timers.map((t) => <TimerControls key={t.id} t={t} category={category} />)}
      {!timers.length && (
        <button type="button" onClick={() => startTimer(recipe, step, seconds)} className="rounded-full border-2 border-accent px-4 py-1.5 font-bold">⏱️ INICIAR TEMPO ({formatClock(seconds)})</button>
      )}
    </div>
  );
}
