import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { emailSavedRecipe } from "@/lib/notice-email.functions";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { RecipeCardView } from "@/components/RecipeCardView";
import { CATEGORY_LABEL, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/caderno")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Meu caderno de receitas — ZELFA" },
      { name: "description", content: "Suas receitas salvas com a ZELFA, separadas por categoria." },
      { property: "og:title", content: "Meu caderno de receitas — ZELFA" },
      { property: "og:description", content: "Receitas salvas, organizadas por categoria, com narração da Quel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.from("saved_recipes").select("id,title,category,minutes,level,markdown").order("created_at", { ascending: false });
    return { recipes: data ?? [] };
  },
  component: Caderno,
});

function Caderno() {
  const { recipes } = Route.useLoaderData();
  const router = useRouter();

  const mailFn = useServerFn(emailSavedRecipe);
  async function sendMail(id: string) {
    const t = toast.loading("Enviando para o seu e-mail...");
    try {
      const { sentTo } = await mailFn({ data: { id } });
      toast.success(`Receita enviada para ${sentTo} 💛`, { id: t });
    } catch {
      toast.error("Não consegui enviar agora. Tente de novo em instantes.", { id: t });
    }
  }
  async function remove(id: string) {
    if (!confirm("Tirar esta receita do caderno?")) return;
    const { error } = await supabase.from("saved_recipes").delete().eq("id", id);
    if (error) { toast.error("Não consegui tirar agora."); return; }
    toast.success("Receita tirada do caderno.");
    void router.invalidate();
  }

  return (
    <AppShell title="📖 Meu caderno de receitas">
      {recipes.length === 0 && (
        <p className="rounded-3xl bg-card p-5 text-xl shadow-soft">Seu caderno ainda está vazio. Na conversa, toque em 💾 SALVAR numa receita para guardar aqui.</p>
      )}
      {RECIPE_CATEGORIES.map((c) => {
        const list = recipes.filter((r) => r.category === c);
        if (!list.length) return null;
        return (
          <section key={c} className="mb-6">
            <h2 className="mb-2 text-2xl font-bold">{CATEGORY_LABEL[c]} <span className="text-base font-normal text-muted-foreground">({list.length})</span></h2>
            {list.map((r) => (
              <div key={r.id}>
                <RecipeCardView saved recipe={{ title: r.title, minutes: r.minutes, level: r.level, category: r.category as RecipeCategory, markdown: r.markdown }} onDelete={() => void remove(r.id)} />
                <Button variant="outline" className="-mt-2 mb-4 h-12 w-full text-lg" onClick={() => void sendMail(r.id)}>📧 RECEBER POR E-MAIL</Button>
              </div>
            ))}
          </section>
        );
      })}
    </AppShell>
  );
}
