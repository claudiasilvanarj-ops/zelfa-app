import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RESTRICTIONS } from "@/lib/diet";
import { speak } from "@/lib/voice";

export const Route = createFileRoute("/_authenticated/restricoes")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Restrições e alergias — ZELFA" },
      { name: "description", content: "Cadastre as alergias e intolerâncias da família. A ZELFA nunca sugere receita com ingrediente restrito." },
      { property: "og:title", content: "Restrições e alergias — ZELFA" },
      { property: "og:description", content: "Filtro rígido de alergias e intolerâncias nas receitas da ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.from("dietary_restrictions").select("restrictions").maybeSingle();
    return { saved: data?.restrictions ?? [] };
  },
  component: Restricoes,
});

function Restricoes() {
  const { saved } = Route.useLoaderData();
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(saved);
  const [busy, setBusy] = useState(false);
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  async function save(list: string[]) {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const payload: Record<string, unknown> = {
      user_id: u.user!.id,
      restrictions: list,
      updated_at: new Date().toISOString(),
    };
    if (list.length === 0) {
      payload.preference = "tudo";
      payload.notes = null;
    }
    const { error } = await supabase.from("dietary_restrictions").upsert(payload as never);
    setBusy(false);
    if (error) { toast.error("Não consegui salvar agora."); return; }
    setSel(list);
    const msg = list.length ? "Pronto! Vou respeitar essas restrições em todas as receitas." : "Anotado: nenhuma restrição.";
    toast.success(msg);
    router.invalidate();
  }

  return (
    <AppShell title="⚠️ Restrições e alergias">
      <p className="text-lg">Marque o que a família <b>não pode comer</b>. A ZELFA nunca vai sugerir receita com esses ingredientes.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {RESTRICTIONS.map((r) => {
          const on = sel.includes(r.key);
          return (
            <button key={r.key} onClick={() => toggle(r.key)} aria-pressed={on}
              className={`flex min-h-24 flex-col items-center justify-center rounded-3xl border-2 p-3 text-lg font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>
              <span className="text-4xl">{r.emoji}</span>{r.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" className="h-14 rounded-full text-lg" disabled={busy} onClick={() => save(sel)}>Salvar restrições</Button>
        <Button size="lg" variant="secondary" className="h-14 rounded-full text-lg" disabled={busy} onClick={() => save([])}>Nenhuma restrição</Button>
        <Button variant="ghost" onClick={() => speak(sel.length ? `Suas restrições: ${sel.map((k) => RESTRICTIONS.find((r) => r.key === k)?.label).join(", ")}.` : "Você ainda não marcou nenhuma restrição.")}>🔊 Ouvir a Quel</Button>
      </div>
    </AppShell>
  );
}
