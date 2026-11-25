import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminEmail } from "@/lib/admin";

export const listInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const allowed = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
    const emailOk = isAdminEmail(email) || (!!allowed && allowed.split(",").map((e) => e.trim()).includes(email));
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!emailOk || !role) throw new Error("Acesso negado");
    const apiKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["GOOGLE_MAIL_API_KEY"];
    if (!apiKey || !connKey) return { messages: [], error: "Gmail não configurado" };
    const auth = { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connKey };
    const list = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages?maxResults=20&q=in:inbox", { headers: auth });
    if (!list.ok) { console.error(`inbox list [${list.status}]: ${await list.text()}`); return { messages: [], error: "Não consegui ler o e-mail agora." }; }
    const ids = ((await list.json()) as { messages?: { id: string }[] }).messages ?? [];
    if (!ids.length) return { messages: [], error: null };
    const boundary = "zelfa_batch";
    const body = ids.map((m) => `--${boundary}\r\nContent-Type: application/http\r\n\r\nGET /gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date\r\n\r\n`).join("") + `--${boundary}--`;
    const res = await fetch("https://connector-gateway.lovable.dev/google_mail/batch/gmail/v1", { method: "POST", headers: { ...auth, "Content-Type": `multipart/mixed; boundary=${boundary}` }, body });
    if (!res.ok) { console.error(`inbox batch [${res.status}]: ${await res.text()}`); return { messages: [], error: "Não consegui ler o e-mail agora." }; }
    const { parseBatch, toInboxMessage } = await import("./inbox");
    const parts = parseBatch(res.headers.get("content-type") ?? "", await res.text()) as Parameters<typeof toInboxMessage>[0][];
    return { messages: parts.map(toInboxMessage), error: null };
  });
