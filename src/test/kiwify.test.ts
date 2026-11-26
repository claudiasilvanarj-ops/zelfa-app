import { expect, it } from "vitest";
import { ANNUAL_PRICE, kiwifyCustomer, kiwifyPaid, kiwifyRevocation } from "@/lib/payment";
const base = { order_id: "o1", order_status: "paid", Customer: { email: "A@x.com" } };
it("plano anual custa R$ 290,00 e libera 366 dias", () => {
  expect(ANNUAL_PRICE).toBe("R$ 290,00");
  expect(kiwifyPaid({ ...base, Commissions: { charge_amount: 29000 } })?.days).toBe(366);
});
it("plano mensal libera 31 dias", () => {
  expect(kiwifyPaid({ ...base, Commissions: { charge_amount: 2990 } })).toEqual({ email: "a@x.com", orderId: "o1", amountCents: 2990, days: 31 });
});
it("pedido não pago não libera", () => {
  expect(kiwifyPaid({ ...base, order_status: "waiting_payment" })).toBeNull();
});
it("extrai nome e telefone da compradora para criação automática de conta", () => {
  expect(kiwifyCustomer({ Customer: { email: "Ana@Teste.com", full_name: "Ana Silva", mobile: "21999990000" } })).toEqual({
    email: "ana@teste.com", name: "Ana Silva", phone: "21999990000",
  });
});
it("detecta reembolso, chargeback e cancelamento de renovação", () => {
  expect(kiwifyRevocation({ order_id: "o2", webhook_event_type: "order_refunded", Customer: { email: "a@x.com" } })).toEqual({
    email: "a@x.com", orderId: "o2", kind: "reembolsou", revokeNow: true,
  });
  expect(kiwifyRevocation({ order_id: "o3", webhook_event_type: "chargeback", Customer: { email: "a@x.com" } })).toEqual({
    email: "a@x.com", orderId: "o3", kind: "chargeback", revokeNow: true,
  });
  expect(kiwifyRevocation({ order_id: "o4", webhook_event_type: "subscription_canceled", Customer: { email: "a@x.com" } })).toEqual({
    email: "a@x.com", orderId: "o4", kind: "cancelou", revokeNow: false,
  });
});
