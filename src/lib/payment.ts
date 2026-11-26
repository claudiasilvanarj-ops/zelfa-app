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

export type KiwifyOrder = {
  order_id?: string; order_status?: string; webhook_event_type?: string;
  Customer?: { email?: string; full_name?: string; first_name?: string; mobile?: string };
  Commissions?: { charge_amount?: number | string; product_base_price?: number | string };
  Subscription?: { status?: string; plan?: { frequency?: string } };
};

/** Returns e-mail, order id, amount and unlocked days when a Kiwify notification confirms a paid order. */
export function kiwifyPaid(n: KiwifyOrder): { email: string; orderId: string; amountCents: number; days: number } | null {
  const email = n.Customer?.email?.trim().toLowerCase();
  const evt = (n.webhook_event_type ?? "").toLowerCase();
  if (evt && !["order_approved", "subscription_renewed"].includes(evt)) return null;
  if (n.order_status !== "paid" || !email || !n.order_id) return null;
  const amountCents = Number(n.Commissions?.charge_amount ?? n.Commissions?.product_base_price ?? 0);
  const freq = (n.Subscription?.plan?.frequency ?? "").toLowerCase();
  const annual = /year|annual|anual/.test(freq) || amountCents >= ANNUAL_PRICE_CENTS;
  return { email, orderId: n.order_id, amountCents, days: annual ? DAYS_PER_ANNUAL_PAYMENT : DAYS_PER_PAYMENT };
}

/** Extracts customer name and phone from a Kiwify payload (used when auto-creating the user account). */
export function kiwifyCustomer(n: KiwifyOrder): { email: string; name: string | null; phone: string | null } | null {
  const email = n.Customer?.email?.trim().toLowerCase();
  if (!email) return null;
  const name = (n.Customer?.full_name ?? n.Customer?.first_name ?? "").trim() || null;
  const phone = (n.Customer?.mobile ?? "").trim() || null;
  return { email, name, phone };
}

/** Detects Kiwify refund, chargeback or subscription cancellation events. */
export function kiwifyRevocation(
  n: KiwifyOrder,
): { email: string; orderId: string; kind: "reembolsou" | "chargeback" | "cancelou"; revokeNow: boolean } | null {
  const email = n.Customer?.email?.trim().toLowerCase();
  if (!email) return null;
  const evt = (n.webhook_event_type ?? "").toLowerCase();
  const status = (n.order_status ?? "").toLowerCase();
  const orderId = n.order_id ?? "";
  if (evt === "chargeback" || status === "chargedback") return { email, orderId, kind: "chargeback", revokeNow: true };
  if (evt === "order_refunded" || status === "refunded") return { email, orderId, kind: "reembolsou", revokeNow: true };
  if (evt === "subscription_canceled" || (n.Subscription?.status ?? "").toLowerCase() === "canceled") {
    return { email, orderId, kind: "cancelou", revokeNow: false };
  }
  return null;
}

/** Kiwify signs the raw body with HMAC-SHA1 (hex) using the webhook token, sent as ?signature=. */
export async function kiwifySignature(token: string, raw: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
