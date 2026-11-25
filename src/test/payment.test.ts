import { expect, it } from "vitest";
import { ANNUAL_PAYMENT_LINK, ANNUAL_PRICE_CENTS, ANNUAL_INSTALLMENTS, ANNUAL_INSTALLMENT_CENTS, PAYMENT_LINK } from "@/lib/payment";
it("novas assinaturas usam somente o pagamento anual", () => {
  expect(PAYMENT_LINK).toBe("https://pay.kiwify.com.br/dg97ouc");
  expect(PAYMENT_LINK).toBe(ANNUAL_PAYMENT_LINK);
});
it("plano anual usa o novo link informado pela Sil", () => {
  expect(ANNUAL_PAYMENT_LINK).toBe("https://pay.kiwify.com.br/dg97ouc");
});
it("anual custa 290 reais sem parcelamento", () => {
  expect(ANNUAL_PRICE_CENTS).toBe(29000);
});
it("anual permite até 12 parcelas de 29,99 com acréscimo", () => {
  expect(ANNUAL_INSTALLMENTS).toBe(12);
  expect(ANNUAL_INSTALLMENT_CENTS).toBe(2999);
  expect(ANNUAL_INSTALLMENTS * ANNUAL_INSTALLMENT_CENTS).toBe(35988);
});
