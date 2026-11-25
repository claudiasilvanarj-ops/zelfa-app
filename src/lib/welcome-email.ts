/** E-mail de boas-vindas da ZELFA, enviado pelo Gmail conectado (zelfaapp@gmail.com). */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export const WELCOME_SUBJECT = "Bem-vindo à ZELFA! 💛 Sua cozinha começa agora";

/** Monta o e-mail RFC 2822 em base64url (testável sem rede). */
export function buildWelcomeEmail(to: string): string {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#1a2b4a;border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <div style="font-size:40px;">🍳</div>
      <h1 style="color:#d4a017;font-size:26px;margin:8px 0 0;">ZELFA</h1>
      <p style="color:#ffffff;font-size:15px;margin:8px 0 0;">Sua Chef de Cozinha Virtual</p>
    </div>
    <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 16px 16px;">
      <p style="font-size:17px;color:#1a2b4a;margin:0 0 16px;"><strong>Seu acesso foi liberado! 🎉</strong></p>
      <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
        A partir de agora você tem uma chef carinhosa no seu bolso. Abriu a geladeira e não sabe o que fazer?
        Conte para a ZELFA o que tem em casa e ela sugere receitas na hora — sem desperdício e do seu jeito.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://zelfa.app" style="background:#2ecc8f;color:#1a2b4a;font-weight:bold;font-size:17px;text-decoration:none;padding:14px 32px;border-radius:999px;display:inline-block;">ABRIR A ZELFA 💛</a>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 8px;"><strong>Como usar no celular:</strong></p>
      <ol style="font-size:14px;color:#333;line-height:1.7;margin:0 0 16px;padding-left:20px;">
        <li>Abra <strong>zelfa.app</strong> no navegador do celular.</li>
        <li>Entre com o mesmo e-mail usado na compra.</li>
        <li>Toque em "Adicionar à tela inicial" para a ZELFA ficar como um aplicativo.</li>
      </ol>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px;">
        <strong>Dica:</strong> na tela inicial, toque em <strong>🍳 Comida</strong> e escreva ou fale os ingredientes
        que você tem. A ZELFA sugere receitas, monta a lista de compras e ainda guarda tudo no seu caderno de receitas.
      </p>
      <p style="font-size:13px;color:#666;line-height:1.6;margin:0;border-top:1px solid #eee;padding-top:16px;">
        Dúvidas? Responda este e-mail ou escreva para <strong>zelfaapp@gmail.com</strong> — será um prazer ajudar. 💛
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#999;margin:16px 0 0;">ZELFA · zelfa.app · Feito com carinho para a sua cozinha</p>
  </div>
</body>
</html>`;
  const raw = [
    `To: ${to}`,
    `Subject: ${header(WELCOME_SUBJECT)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");
  return b64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Envia o e-mail de boas-vindas pelo Gmail conectado. Lança erro com status e corpo do provedor. */
export async function sendWelcomeEmail(to: string): Promise<void> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!apiKey || !connKey) throw new Error("Gmail não configurado");
  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: buildWelcomeEmail(to) }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`welcome email failed [${res.status}]: ${body}`);
    throw new Error(`Gmail falhou [${res.status}]: ${body}`);
  }
}
