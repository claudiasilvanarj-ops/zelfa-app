/** Only these e-mails may open the admin area (they must also hold the admin role). */
export const ADMIN_EMAILS = ["claudia.silvana.rj@gmail.com", "paganinistudioai@gmail.com"];
export const ADMIN_EMAIL = ADMIN_EMAILS[0]!;
export const ONLINE_MINUTES = 5;

export function isAdminEmail(email: string | null | undefined) {
  return ADMIN_EMAILS.includes((email ?? "").trim().toLowerCase());
}

export type VisitSource = "instagram" | "facebook" | "direto" | "busca" | "outro";
export const SOURCE_LABEL: Record<VisitSource, string> = { instagram: "Instagram", facebook: "Facebook", direto: "Direto", busca: "Busca", outro: "Outros" };

/** Classifies where a visitor came from using the referrer and utm_source. */
export function classifySource(referrer: string, utm?: string | null): VisitSource {
  const s = `${utm ?? ""} ${referrer}`.toLowerCase();
  if (/instagram|ig\.me|\bl\.instagram/.test(s)) return "instagram";
  if (/facebook|fb\.com|fb\.me|m\.me/.test(s)) return "facebook";
  if (/google\.|bing\.|yahoo\.|duckduckgo|ecosia|search/.test(s)) return "busca";
  if (!s.trim()) return "direto";
  try {
    if (referrer && new URL(referrer).hostname === globalThis.location?.hostname) return "direto";
  } catch { /* ignore */ }
  return "outro";
}

export function isOnline(lastSeen: string, now = Date.now()) {
  return now - new Date(lastSeen).getTime() <= ONLINE_MINUTES * 60_000;
}

const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

/** Sum of sales (R$) per day for the last `days` days, oldest first. */
export function salesByDay(payments: { amount_cents: number; paid_at: string }[], days = 30, now = new Date()) {
  const out = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) out.set(dayKey(new Date(now.getTime() - i * 864e5)), 0);
  for (const p of payments) {
    const k = dayKey(new Date(p.paid_at));
    if (out.has(k)) out.set(k, out.get(k)! + p.amount_cents / 100);
  }
  return [...out].map(([dia, valor]) => ({ dia: dia.slice(8, 10) + "/" + dia.slice(5, 7), valor }));
}

/** Number of first payments (new subscribers) per week for the last `weeks` weeks. */
export function newSubscribersByWeek(payments: { user_id: string; paid_at: string }[], weeks = 8, now = new Date()) {
  const first = new Map<string, number>();
  for (const p of payments) {
    const t = new Date(p.paid_at).getTime();
    if (!first.has(p.user_id) || t < first.get(p.user_id)!) first.set(p.user_id, t);
  }
  const rows = Array.from({ length: weeks }, (_, i) => {
    const end = now.getTime() - (weeks - 1 - i) * 7 * 864e5;
    return { semana: dayKey(new Date(end - 6 * 864e5)).slice(5).split("-").reverse().join("/"), start: end - 7 * 864e5, end, novos: 0 };
  });
  for (const t of first.values()) {
    const r = rows.find((x) => t > x.start && t <= x.end);
    if (r) r.novos++;
  }
  return rows.map(({ semana, novos }) => ({ semana, novos }));
}

/** CSV with ; separator (opens correctly in Brazilian Excel) and a BOM for accents. */
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "\uFEFF";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const raw = v == null ? "" : String(v);
    const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw; // neutralize spreadsheet formulas
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\n");
}
