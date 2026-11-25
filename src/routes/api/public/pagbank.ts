import { createFileRoute } from "@tanstack/react-router";
import { DAYS_PER_PAYMENT, paidCharge } from "@/lib/payment";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/pagbank")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["PAGBANK_TOKEN"];
        if (!token) return new Response("not configured", { status: 503 });
        const raw = await request.text();
        const sig = request.headers.get("x-authenticity-token") ?? "";
        if (!sig || sig.toLowerCase() !== (await sha256(`${token}-${raw}`))) {
          return new Response("invalid signature", { status: 401 });
        }
        let body: unknown;
        try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
        const paid = paidCharge(body as never);
        if (!paid) return new Response("ignored");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin.from("account_access").select("paid_until,last_payment_ref").eq("user_id", paid.userId).maybeSingle();
        if (row?.last_payment_ref === paid.chargeId) return new Response("ok");
        const base = Math.max(Date.now(), row?.paid_until ? new Date(row.paid_until).getTime() : 0);
        const until = new Date(base + DAYS_PER_PAYMENT * 864e5).toISOString();
        const { error } = await supabaseAdmin.from("account_access").upsert({
          user_id: paid.userId, paid_until: until, last_payment_ref: paid.chargeId, updated_at: new Date().toISOString(),
        });
        if (error) return new Response("db error", { status: 500 });
        const { error: payErr } = await supabaseAdmin.from("payments").upsert(
          { user_id: paid.userId, charge_id: paid.chargeId, amount_cents: paid.amountCents },
          { onConflict: "charge_id", ignoreDuplicates: true },
        );
        if (payErr) return new Response("db error", { status: 500 });
        await supabaseAdmin.from("customer_events").insert({ user_id: paid.userId, kind: "comprou", detail: `R$ ${(paid.amountCents / 100).toFixed(2).replace(".", ",")}` });
        return new Response("ok");
      },
    },
  },
});
