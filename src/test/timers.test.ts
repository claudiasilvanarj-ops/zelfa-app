import { describe, expect, it } from "vitest";
import { alertPlan, alertText, formatClock, stepSeconds } from "@/lib/timers";

describe("cronômetro das receitas", () => {
  it("lê o tempo das etapas", () => {
    expect(stepSeconds("Asse por 30 minutos")).toBe(1800);
    expect(stepSeconds("Deixe descansar por 1 hora")).toBe(3600);
    expect(stepSeconds("Frite por 3 minutos de cada lado")).toBe(180);
    expect(stepSeconds("Cozinhe por 1 hora e 15 minutos")).toBe(4500);
    expect(stepSeconds("Asse de 20 a 25 minutos")).toBe(1200);
    expect(stepSeconds("Descanse meia hora")).toBe(1800);
    expect(stepSeconds("Misture tudo")).toBe(0);
  });
  it("avisa na metade e 5 minutos antes em etapas longas", () => {
    expect(alertPlan(1800).map((a) => [a.kind, a.at])).toEqual([["metade", 900], ["quase", 1500], ["fim", 1800], ["pergunta", 2400]]);
  });
  it("etapa curta avisa 1 minuto antes; 1 minuto não repete aviso", () => {
    expect(alertPlan(300).find((a) => a.kind === "quase")?.at).toBe(240);
    expect(alertPlan(60).some((a) => a.kind === "quase")).toBe(false);
  });
  it("pergunta 10 minutos depois do fim", () => {
    expect(alertPlan(60).find((a) => a.kind === "pergunta")?.at).toBe(660);
  });
  it("mensagens com o nome da receita, sem gênero", () => {
    expect(alertText("fim", "Torta")).toBe("⏰ Tempo concluído! Sua Torta está pronta 💛");
    expect(alertText("pergunta", "Torta")).not.toMatch(/querid/);
  });
  it("mostra minutos e segundos", () => {
    expect(formatClock(65)).toBe("01:05");
  });
});

import { retime, type Timer } from "@/lib/timers";
describe("controles do cronômetro", () => {
  const base: Timer = { id: "a", recipe: "Torta", step: "Asse por 30 minutos", total: 1800, endsAt: 0, pausedLeft: null, fired: ["metade"], done: false };
  it("+5 min soma sem recomeçar", () => {
    const t = retime(base, 2100, 600 + 300, 0);
    expect(t.endsAt).toBe(900_000);
    expect(t.total).toBe(2100);
  });
  it("aumentar o total de 30 para 40 min devolve o aviso de metade ainda não alcançado", () => {
    const t = retime(base, 2400, 1500, 0); // 15 min passados, metade agora em 20 min
    expect(t.fired).toEqual([]);
  });
  it("ajustar enquanto pausado continua pausado", () => {
    expect(retime({ ...base, pausedLeft: 100 }, 1800, 300, 0).pausedLeft).toBe(300);
  });
});
