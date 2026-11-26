import { createFileRoute } from "@tanstack/react-router";
import { kiwifyCustomer, kiwifyPaid, kiwifyRevocation, kiwifySignature, type KiwifyOrder } from "@/lib/payment";

export const Route = createFileRoute("/api/public/kiwify")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["KIWIFY_TOKEN"]?.trim();
        if (!token) return new Response("not configured", { status: 503 });
        const raw = await request.text();
        const sig = new URL(request.url).searchParams.get("signature") ?? "";
        if (!sig || sig.toLowerCase() !== (await kiwifySignature(token, raw))) return new Response("invalid signature", { status: 401 });
        let body: KiwifyOrder;
        try { body = JSON.parse(raw) as KiwifyOrder; } catch { return new Response("bad json", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1) Reembolso, chargeback ou cancelamento de assinatura -> atualiza /admin automaticamente
        const rev = kiwifyRevocation(body);
        if (rev) {
          const { data: prof } = await supabaseAdmin.from("profiles").select("id").ilike("email", rev.email).maybeSingle();
          if (!prof) return new Response("ignored");
          const nowIso = new Date().toISOString();
          if (rev.revokeNow) {
            await supabaseAdmin.from("account_access").upsert({ user_id: prof.id, paid_until: nowIso, updated_at: nowIso });
          }
          await supabaseAdmin.from("customer_admin").upsert({ user_id: prof.id, canceled_at: nowIso, updated_at: nowIso });
          await supabaseAdmin.from("customer_events").insert({
            user_id: prof.id,
            kind: rev.kind,
            detail: rev.revokeNow ? "Acesso encerrado automaticamente (Kiwify)" : "Renovação cancelada na Kiwify",
          });
          return new Response("ok");
        }

        // 2) Compra aprovada ou assinatura renovada -> encontra ou cria a conta automaticamente e libera acesso
        const paid = kiwifyPaid(body);
        if (!paid) return new Response("ignored");
        const customer = kiwifyCustomer(body);

        let { data: prof } = await supabaseAdmin.from("profiles").select("id,phone,display_name").ilike("email", paid.email).maybeSingle();
        if (!prof) {
          // Cliente comprou na Kiwify antes de criar conta no app: cria automaticamente já confirmada!
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: paid.email,
            email_confirm: true,
            user_metadata: customer?.name ? { display_name: customer.name } : undefined,
          });
          if (createErr || !created.user) {
            console.error("kiwify: failed to auto-create user", paid.orderId, createErr?.message);
            return new Response("user create error", { status: 500 });
          }
          const newId = created.user.id;
          await supabaseAdmin.from("profiles").upsert({
            id: newId,
            email: paid.email,
            display_name: customer?.name ?? paid.email.split("@")[0] ?? "Chef",
            phone: customer?.phone ?? null,
          });
          prof = { id: newId, phone: customer?.phone ?? null, display_name: customer?.name ?? null };
        } else if (customer?.phone && !prof.phone) {
          await supabaseAdmin.from("profiles").update({ phone: customer.phone }).eq("id", prof.id);
        }

        const userId = prof.id;
        const { data: row } = await supabaseAdmin.from("account_access").select("paid_until,last_payment_ref").eq("user_id", userId).maybeSingle();
        if (row?.last_payment_ref === paid.orderId) return new Response("ok");
        const firstAccess = !row;
        const base = Math.max(Date.now(), row?.paid_until ? new Date(row.paid_until).getTime() : 0);
        const until = new Date(base + paid.days * 864e5).toISOString();
        const { error } = await supabaseAdmin.from("account_access").upsert({
          user_id: userId,
          paid_until: until,
          last_payment_ref: paid.orderId,
          updated_at: new Date().toISOString(),
        });
        if (error) return new Response("db error", { status: 500 });
        await supabaseAdmin.from("payments").upsert(
          { user_id: userId, charge_id: paid.orderId, amount_cents: paid.amountCents },
          { onConflict: "charge_id", ignoreDuplicates: true },
        );
        await supabaseAdmin.from("customer_events").insert({
          user_id: userId,
          kind: "comprou",
          detail: `R$ ${(paid.amountCents / 100).toFixed(2).replace(".", ",")} (Kiwify)`,
        });
        if (firstAccess) {
          try {
            const { sendWelcomeEmail } = await import("@/lib/welcome-email");
            await sendWelcomeEmail(paid.email);
          } catch (e) {
            console.error("kiwify: welcome email failed", e);
          }
        }
        return new Response("ok");
      },
    },
  },
});
