import { expect, it } from "vitest";
import { ANNUAL_PRICE, kiwifyPaid } from "@/lib/payment";
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
