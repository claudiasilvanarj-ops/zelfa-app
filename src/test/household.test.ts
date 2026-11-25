import { describe, it, expect } from "vitest";
import { scheduleHousehold, DEFAULT_ROUTINE, estimateDuration, brazilDay } from "@/lib/household";

const now = new Date("2026-10-28T10:00:00-03:00");
describe("Planejamento doméstico", () => {
  it("distribui roupas, mercado, faxina e manutenção em dias diferentes", () => {
    const tasks = (["Roupas", "Mercado", "Faxina", "Manutenção"] as const).map((kind) => ({ title: kind, task_kind: kind, duration_minutes: estimateDuration(kind) }));
    const result = scheduleHousehold(tasks, [], DEFAULT_ROUTINE, now);
    expect(new Set(result.map((a) => brazilDay(new Date(a.starts_at)))).size).toBe(4);
  });
  it("respeita o limite diário de 60 minutos", () => {
    const result = scheduleHousehold(Array.from({ length: 8 }, () => ({ title: "Roupas", task_kind: "Roupas" as const, duration_minutes: 45 })), [], { ...DEFAULT_ROUTINE, daily_minutes: 60 }, now);
    expect(new Set(result.map((a) => brazilDay(new Date(a.starts_at)))).size).toBe(8);
  });
  it("evita dia bloqueado quando a rotina muda", () => {
    const [task] = scheduleHousehold([{ title: "Faxina", task_kind: "Faxina", duration_minutes: 60 }], [], { ...DEFAULT_ROUTINE, blocked_dates: ["2026-10-28"] }, now);
    expect(task?.starts_at).toBe("2026-10-29T12:00:00.000Z");
  });
  it("reagenda pendência no futuro sem coincidir com consulta", () => {
    const [task] = scheduleHousehold([{ title: "Mercado", task_kind: "Mercado", duration_minutes: 60, earliest: "2026-10-29" }], [{ starts_at: "2026-10-29T09:00:00-03:00", duration_minutes: 60 }], DEFAULT_ROUTINE, now);
    expect(task?.starts_at).toBe("2026-10-29T13:00:00.000Z");
  });
  it("pede divisão de tarefa que excede o limite", () => {
    expect(() => scheduleHousehold([{ title: "Faxina", task_kind: "Faxina", duration_minutes: 180 }], [], DEFAULT_ROUTINE, now)).toThrow("dividida");
  });
});