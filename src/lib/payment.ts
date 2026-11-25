/** Links de pagamento (Kiwify). */
export const ANNUAL_PAYMENT_LINK = "https://pay.kiwify.com.br/dg97ouc";
export const PAYMENT_LINK = ANNUAL_PAYMENT_LINK;
/** Legacy monthly values retained for existing payment notifications, not new offers. */
export const MONTHLY_PRICE = "R$ 29,90";
export const PRICE_CENTS = 2990;
/** Each confirmed payment unlocks this many days. */
export const DAYS_PER_PAYMENT = 31;

type Notice = { reference_id?: string; charges?: { id?: string; status?: string; amount?: { value?: number } }[] };

/** Returns the user id and charge id when a PagBank notification confirms a full payment. */
export function paidCharge(n: Notice): { userId: string; chargeId: string; amountCents: number } | null {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!n.reference_id || !uuid.test(n.reference_id)) return null;
  const c = n.charges?.find((x) => x.status === "PAID" && (x.amount?.value ?? 0) >= PRICE_CENTS && x.id);
  return c ? { userId: n.reference_id, chargeId: c.id!, amountCents: c.amount!.value! } : null;
}

export const ANNUAL_PRICE = "R$ 290,00";
export const ANNUAL_PRICE_CENTS = 29000;
export const ANNUAL_INSTALLMENTS = 12;
export const ANNUAL_INSTALLMENT_CENTS = 2999;
export const ANNUAL_INSTALLMENT_PRICE = "R$ 29,99";
export const ANNUAL_INSTALLMENT_TOTAL = "R$ 359,88";
/** An annual payment unlocks this many days. */
export const DAYS_PER_ANNUAL_PAYMENT = 366;

type KiwifyOrder = {
  order_id?: string; order_status?: string; webhook_event_type?: string;
  Customer?: { email?: string };
  Commissions?: { charge_amount?: number | string; product_base_price?: number | string };
  Subscription?: { plan?: { frequency?: string } };
};

/** Returns e-mail, order id, amount and unlocked days when a Kiwify notification confirms a paid order. */
export function kiwifyPaid(n: KiwifyOrder): { email: string; orderId: string; amountCents: number; days: number } | null {
  const email = n.Customer?.email?.trim().toLowerCase();
  if (n.order_status !== "paid" || !email || !n.order_id) return null;
  const amountCents = Number(n.Commissions?.charge_amount ?? n.Commissions?.product_base_price ?? 0);
  const freq = (n.Subscription?.plan?.frequency ?? "").toLowerCase();
  const annual = /year|annual|anual/.test(freq) || amountCents >= ANNUAL_PRICE_CENTS;
  return { email, orderId: n.order_id, amountCents, days: annual ? DAYS_PER_ANNUAL_PAYMENT : DAYS_PER_PAYMENT };
}

/** Kiwify signs the raw body with HMAC-SHA1 (hex) using the webhook token, sent as ?signature=. */
export async function kiwifySignature(token: string, raw: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
