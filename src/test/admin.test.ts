import { expect, it } from "vitest";
import { classifySource, isAdminEmail, isOnline, newSubscribersByWeek, salesByDay, toCsv } from "@/lib/admin";

it("só o e-mail da Sil abre a administração", () => {
  expect(isAdminEmail("Claudia.Silvana.RJ@gmail.com")).toBe(true);
  expect(isAdminEmail("outra@gmail.com")).toBe(false);
  expect(isAdminEmail("PaganiniStudioAI@gmail.com")).toBe(true);
});

it("classifica a origem do visitante", () => {
  expect(classifySource("https://l.instagram.com/x")).toBe("instagram");
  expect(classifySource("https://m.facebook.com/")).toBe("facebook");
  expect(classifySource("https://www.google.com/")).toBe("busca");
  expect(classifySource("")).toBe("direto");
});

it("online agora = ativo nos últimos 5 minutos", () => {
  const now = Date.now();
  expect(isOnline(new Date(now - 4 * 60_000).toISOString(), now)).toBe(true);
  expect(isOnline(new Date(now - 6 * 60_000).toISOString(), now)).toBe(false);
});

it("vendas por dia somam em reais nos últimos 30 dias", () => {
  const now = new Date();
  const rows = salesByDay([{ amount_cents: 2990, paid_at: now.toISOString() }, { amount_cents: 2990, paid_at: now.toISOString() }], 30, now);
  expect(rows).toHaveLength(30);
  expect(rows[29]!.valor).toBeCloseTo(59.8);
});

it("novo assinante conta só no primeiro pagamento", () => {
  const now = new Date();
  const old = new Date(now.getTime() - 20 * 864e5).toISOString();
  const rows = newSubscribersByWeek([{ user_id: "a", paid_at: old }, { user_id: "a", paid_at: now.toISOString() }], 8, now);
  expect(rows.reduce((s, r) => s + r.novos, 0)).toBe(1);
  expect(rows[7]!.novos).toBe(0);
});

it("CSV usa ponto e vírgula e protege aspas", () => {
  expect(toCsv([{ nome: 'Ana "A"', email: "a@x.com" }])).toBe('\uFEFFnome;email\n"Ana ""A""";a@x.com');
});
