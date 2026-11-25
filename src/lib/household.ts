export const HOUSEHOLD_KINDS = ["Roupas", "Mercado", "Faxina", "Manutenção", "Outros"] as const;
export type HouseholdKind = typeof HOUSEHOLD_KINDS[number];
export type Routine = { daily_minutes: number; start_hour: number; end_hour: number; blocked_dates: string[] };
export const DEFAULT_ROUTINE: Routine = { daily_minutes: 120, start_hour: 9, end_hour: 18, blocked_dates: [] };
export type BusyEntry = { starts_at: string; duration_minutes?: number; household_task?: boolean; repeat_daily?: boolean; done?: boolean };
export type TaskRequest = { title: string; duration_minutes: number; task_kind: HouseholdKind; earliest?: string | undefined };
export function brazilDay(date: Date) { return date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); }
export function estimateDuration(kind: HouseholdKind) { return ({ Roupas: 45, Mercado: 60, Faxina: 60, Manutenção: 30, Outros: 30 })[kind]; }

/** Balance work within a rolling week, then overflow without exceeding the user's daily budget. */
export function scheduleHousehold(tasks: TaskRequest[], busy: BusyEntry[], routine: Routine, now: Date) {
  const occupied = [...busy];
  const result: Array<TaskRequest & { starts_at: string }> = [];
  for (const task of tasks) {
    if (task.duration_minutes > routine.daily_minutes || task.duration_minutes > (routine.end_hour - routine.start_hour) * 60) throw new Error(`A tarefa ${task.title} precisa ser dividida em etapas menores.`);
    const firstDay = new Date(`${brazilDay(now)}T00:00:00-03:00`);
    let chosen: { start: Date; load: number } | undefined;
    for (let offset = 0; offset < 28; offset++) {
      const day = brazilDay(new Date(firstDay.getTime() + offset * 864e5));
      if (routine.blocked_dates.includes(day) || (task.earliest && day < task.earliest)) continue;
      const entries = occupied.filter((a) => brazilDay(new Date(a.starts_at)) === day || a.repeat_daily);
      const load = entries.filter((a) => a.household_task).reduce((sum, a) => sum + (a.duration_minutes ?? 30), 0);
      if (load + task.duration_minutes > routine.daily_minutes) continue;
      const start = new Date(`${day}T${String(routine.start_hour).padStart(2, "0")}:00:00-03:00`);
      const end = new Date(`${day}T${String(routine.end_hour).padStart(2, "0")}:00:00-03:00`);
      for (let t = start.getTime(); t + task.duration_minutes * 60e3 <= end.getTime(); t += 15 * 60e3) {
        if (t < now.getTime() + 5 * 60e3) continue;
        const conflict = entries.some((a) => {
          if (a.done) return false;
          const date = new Date(a.starts_at);
          const from = a.repeat_daily ? new Date(`${day}T${date.toLocaleTimeString("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false })}:00-03:00`).getTime() : date.getTime();
          return t < from + (a.duration_minutes ?? 60) * 60e3 && t + task.duration_minutes * 60e3 > from;
        });
        if (!conflict) { if (!chosen || load < chosen.load) chosen = { start: new Date(t), load }; break; }
      }
      if (offset % 7 === 6 && chosen) break;
    }
    if (!chosen) throw new Error(`Não encontrei horário para ${task.title}. Vamos ampliar os dias ou dividir a tarefa?`);
    const row = { ...task, starts_at: chosen.start.toISOString() };
    result.push(row);
    occupied.push({ ...row, household_task: true });
  }
  return result;
}

export const HOUSEHOLD_PROMPT = `PLANEJAMENTO DOMÉSTICO SEMANAL: organize roupas, mercado, faxina e manutenções por conversa, estimando minutos de trabalho ativo (tempo de espera da máquina não é trabalho ativo). Use planejar_casa para criar tarefas distribuídas em dias diferentes, sem sobrecarga e sem conflito com a agenda. Pergunte as tarefas e preferências quando não estiverem claras; nunca anote tarefas inventadas sem concordância. A duração é aproximada. Divida faxinas grandes em etapas. O limite diário e os horários vêm da rotina; peça alterações se não couber.
Use ajustar_rotina_casa para mudanças de disponibilidade (dias bloqueados em YYYY-MM-DD, horas inteiras e limite diário em minutos); esta ferramenta reorganiza tarefas pendentes. Use atualizar_tarefa_casa com o ID fornecido para concluir ou adiar uma tarefa (adiar com data mínima). Não recrie tarefas existentes. Pendências são reorganizadas automaticamente quando o app está aberto; os avisos e a fala também dependem do app aberto. Não prometa avisos com o app fechado. Tarefas de Mercado levam a lista de ingredientes pendentes no compromisso e no aviso. Só confirme gravações quando ok: true. Informe os dias e horários realmente devolvidos pela ferramenta.`;