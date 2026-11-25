import { createFileRoute } from "@tanstack/react-router";
import { kiwifyPaid, kiwifySignature } from "@/lib/payment";

export const Route = createFileRoute("/api/public/kiwify")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["KIWIFY_TOKEN"];
        if (!token) return new Response("not configured", { status: 503 });
        const raw = await request.text();
        const sig = new URL(request.url).searchParams.get("signature") ?? "";
        if (!sig || sig.toLowerCase() !== (await kiwifySignature(token, raw))) return new Response("invalid signature", { status: 401 });
        let body: unknown;
        try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
        const paid = kiwifyPaid(body as never);
        if (!paid) return new Response("ignored");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: prof } = await supabaseAdmin.from("profiles").select("id").ilike("email", paid.email).maybeSingle();
        if (!prof) { console.error("kiwify: no account for paid order", paid.orderId); return new Response("no account", { status: 404 }); }
        const userId = prof.id;
        const { data: row } = await supabaseAdmin.from("account_access").select("paid_until,last_payment_ref").eq("user_id", userId).maybeSingle();
        if (row?.last_payment_ref === paid.orderId) return new Response("ok");
        const firstAccess = !row;
        const base = Math.max(Date.now(), row?.paid_until ? new Date(row.paid_until).getTime() : 0);
        const until = new Date(base + paid.days * 864e5).toISOString();
        const { error } = await supabaseAdmin.from("account_access").upsert({ user_id: userId, paid_until: until, last_payment_ref: paid.orderId, updated_at: new Date().toISOString() });
        if (error) return new Response("db error", { status: 500 });
        await supabaseAdmin.from("payments").upsert({ user_id: userId, charge_id: paid.orderId, amount_cents: paid.amountCents }, { onConflict: "charge_id", ignoreDuplicates: true });
        await supabaseAdmin.from("customer_events").insert({ user_id: userId, kind: "comprou", detail: `R$ ${(paid.amountCents / 100).toFixed(2).replace(".", ",")} (Kiwify)` });
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
