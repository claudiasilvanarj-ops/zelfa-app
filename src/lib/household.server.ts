import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_ROUTINE, HOUSEHOLD_KINDS, scheduleHousehold, type Routine, type TaskRequest, type HouseholdKind } from "./household";
import { marketNotes } from "./shopping";

type Client = SupabaseClient<Database>;
export async function householdContext(client: Client, userId: string) {
  const [{ data: routine, error: re }, { data: entries, error: ae }] = await Promise.all([
    client.from("household_preferences").select("*").eq("user_id", userId).maybeSingle(),
    client.from("appointments").select("*").eq("user_id", userId).or(`done.eq.false,starts_at.gte.${new Date().toISOString().slice(0, 10)}`).order("starts_at"),
  ]);
  if (re || ae) throw new Error("Não consegui consultar seu planejamento.");
  return { routine: routine ?? DEFAULT_ROUTINE, entries: entries ?? [] };
}

export async function addHousehold(client: Client, userId: string, tasks: TaskRequest[]) {
  const { routine, entries } = await householdContext(client, userId);
  const planned = scheduleHousehold(tasks, entries, routine, new Date());
  const { data: items, error: ie } = await client.from("shopping_items").select("*").eq("checked", false).eq("user_id", userId);
  if (ie) throw new Error("Não consegui consultar sua lista de compras.");
  const { data, error } = await client.from("appointments").insert(planned.map((t) => ({ user_id: userId, title: t.title, starts_at: t.starts_at, duration_minutes: t.duration_minutes, task_kind: t.task_kind, household_task: true, category: t.task_kind === "Mercado" ? "Mercado" : "Lembretes", notes: t.task_kind === "Mercado" ? marketNotes(null, items ?? []) : null }))).select("id,title,starts_at,duration_minutes");
  if (error) throw new Error("Não consegui salvar as tarefas.");
  return data;
}

export async function reorganizeHousehold(client: Client, userId: string, all = false, earliest?: string, onlyId?: string) {
  const now = new Date();
  const { routine, entries } = await householdContext(client, userId);
  const pending = entries.filter((a) => {
    if (!a.household_task || a.done) return false;
    if (onlyId) return a.id === onlyId;
    const start = new Date(a.starts_at).getTime();
    const conflict = entries.some((b) => {
      if (b.household_task || b.done || b.id === a.id) return false;
      const date = new Date(b.starts_at);
      const from = b.repeat_daily ? new Date(`${new Date(a.starts_at).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })}T${date.toLocaleTimeString("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false })}:00-03:00`).getTime() : date.getTime();
      return start < from + b.duration_minutes * 60e3 && start + a.duration_minutes * 60e3 > from;
    });
    return all || conflict || start + a.duration_minutes * 60e3 < now.getTime();
  });
  if (!pending.length) return [];
  const ids = new Set(pending.map((a) => a.id));
  const planned = scheduleHousehold(pending.map((a) => ({ title: a.title, task_kind: HOUSEHOLD_KINDS.includes(a.task_kind as HouseholdKind) ? a.task_kind as HouseholdKind : "Outros", duration_minutes: a.duration_minutes, earliest })), entries.filter((a) => !ids.has(a.id)), routine, now);
  const changes = [];
  for (const [index, task] of planned.entries()) {
    const old = pending[index];
    if (!old || old.starts_at === task.starts_at) continue;
    const { error } = await client.from("appointments").update({ starts_at: task.starts_at }).eq("id", old.id).eq("user_id", userId).eq("starts_at", old.starts_at);
    if (error) throw new Error("Algumas tarefas não puderam ser ajustadas. Confira sua agenda.");
    changes.push({ id: old.id, title: task.title, starts_at: task.starts_at });
  }
  return changes;
}

export async function changeRoutine(client: Client, userId: string, patch: { [K in keyof Routine]?: Routine[K] | undefined }) {
  const { routine, entries } = await householdContext(client, userId);
  const next: Routine = { daily_minutes: patch.daily_minutes ?? routine.daily_minutes, start_hour: patch.start_hour ?? routine.start_hour, end_hour: patch.end_hour ?? routine.end_hour, blocked_dates: patch.blocked_dates ?? routine.blocked_dates };
  const pending = entries.filter((a) => a.household_task && !a.done);
  // Verify feasibility before changing availability.
  scheduleHousehold(pending.map((a) => ({ title: a.title, duration_minutes: a.duration_minutes, task_kind: "Outros" })), entries.filter((a) => !a.household_task || a.done), next, new Date());
  const { error } = await client.from("household_preferences").upsert({ ...next, user_id: userId });
  if (error) throw new Error("Não consegui salvar sua rotina.");
  return reorganizeHousehold(client, userId, true);
}