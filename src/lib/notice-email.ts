/** Avisos por e-mail da ZELFA (cópia de receita salva), enviados pelo Gmail conectado. */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const recipeSubject = (title: string) => `Sua receita da ZELFA: ${title.replace(/[\r\n]+/g, " ").slice(0, 120)} 🍳`;

/** Converte o texto da receita em HTML simples e seguro. */
export function recipeHtml(markdown: string): string {
  return markdown.split(/\r?\n/).map((l) => {
    const t = esc(l.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (!t) return "";
    if (/^#+\s/.test(t)) return `<h3 style="color:#1a2b4a;margin:16px 0 6px;">${t.replace(/^#+\s/, "")}</h3>`;
    return `<p style="margin:0 0 6px;line-height:1.6;color:#333;">${t}</p>`;
  }).join("\n");
}

export function buildRecipeEmail(to: string, title: string, markdown: string): string {
  if (/[\r\n]/.test(to)) throw new Error("e-mail inválido");
  const html = `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
<div style="background:#1a2b4a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
<h1 style="color:#d4a017;font-size:22px;margin:0;">${esc(title)}</h1></div>
<div style="background:#fff;padding:24px;border-radius:0 0 16px 16px;font-size:15px;">${recipeHtml(markdown)}
<div style="text-align:center;margin:24px 0 0;"><a href="https://zelfa.app/caderno" style="background:#2ecc8f;color:#1a2b4a;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:999px;display:inline-block;">ABRIR MEU CADERNO 💛</a></div>
</div><p style="text-align:center;font-size:12px;color:#999;">ZELFA · zelfa.app</p></div></body></html>`;
  const raw = [`To: ${to}`, `Subject: ${header(recipeSubject(title))}`, "MIME-Version: 1.0", 'Content-Type: text/html; charset="UTF-8"', "", html].join("\r\n");
  return b64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendGmailRaw(raw: string): Promise<void> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!apiKey || !connKey) throw new Error("Gmail não configurado");
  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`notice email failed [${res.status}]: ${body}`);
    throw new Error(`Gmail falhou [${res.status}]`);
  }
}
