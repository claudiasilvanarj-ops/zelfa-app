import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminEmail } from "@/lib/admin";

/** Server-side admin check: authorized e-mail (ADMIN_EMAIL env override) + admin role. Failures are logged. */
export const verifyAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const allowed = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
    const emailOk = isAdminEmail(email) || (!!allowed && allowed.split(",").map((e) => e.trim()).includes(email));
    const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (emailOk && role) return { ok: true as const };
    await context.supabase.rpc("log_admin_attempt", { _email: email, _reason: emailOk ? "sem papel de administradora" : "e-mail não autorizado" });
    return { ok: false as const };
  });
