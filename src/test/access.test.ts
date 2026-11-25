import { describe, it, expect } from "vitest";
import { paidCharge, PRICE_CENTS, DAYS_PER_PAYMENT } from "@/lib/payment";

const user = "3f2b6c1e-1111-4222-8333-444455556666";

describe("liberação após pagamento PagBank", () => {
  it("libera quando a cobrança de R$ 29,90 está paga", () => {
    expect(paidCharge({ reference_id: user, charges: [{ id: "CHAR_1", status: "PAID", amount: { value: 2990 } }] })).toEqual({ userId: user, chargeId: "CHAR_1", amountCents: 2990 });
  });
  it("não libera pagamento pendente ou recusado", () => {
    expect(paidCharge({ reference_id: user, charges: [{ id: "C", status: "WAITING", amount: { value: 2990 } }] })).toBeNull();
    expect(paidCharge({ reference_id: user, charges: [{ id: "C", status: "DECLINED", amount: { value: 2990 } }] })).toBeNull();
  });
  it("não libera valor menor que a mensalidade", () => {
    expect(paidCharge({ reference_id: user, charges: [{ id: "C", status: "PAID", amount: { value: 100 } }] })).toBeNull();
  });
  it("mensalidade é R$ 29,90 e libera 31 dias", () => {
    expect(PRICE_CENTS).toBe(2990);
    expect(DAYS_PER_PAYMENT).toBe(31);
  });
});
