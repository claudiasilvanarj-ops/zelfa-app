import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { RecipeCardView } from "@/components/RecipeCardView";
import { recipeKey, signedUrls } from "@/lib/dish-community";
import { CATEGORY_LABEL, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/album")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Pasta de Receitas e Fotos — ZELFA" },
      { name: "description", content: "Suas receitas geradas pela ZELFA organizadas junto com as fotos dos seus pratos." },
      { property: "og:title", content: "Pasta de Receitas e Fotos — ZELFA" },
      { property: "og:description", content: "Receitas e fotos organizadas juntas no Álbum da Cozinha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Album,
});

type SavedRecipe = { id: string; title: string; category: string; minutes: number | null; level: string | null; markdown: string; created_at: string };
type Photo = { id: string; recipe_title: string; recipe_key: string; category: string; storage_path: string; status: string; created_at: string };
const STATUS: Record<string, string> = { privada: "🔒 Só para você", pendente: "⏳ Enviada para o Admin", aprovada: "⭐ Aprovada para o Instagram" };

function Album() {
  const [recipes, setRecipes] = useState<SavedRecipe[] | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"todas" | "com_foto" | "sem_foto">("todas");

  const load = useCallback(async () => {
    const [{ data: rData }, { data: pData }] = await Promise.all([
      supabase.from("saved_recipes").select("id,title,category,minutes,level,markdown,created_at").order("created_at", { ascending: false }),
      supabase.from("community_photos").select("id,recipe_title,recipe_key,category,storage_path,status,created_at").order("created_at", { ascending: false }),
    ]);
    const rList = (rData ?? []) as SavedRecipe[];
    const pList = (pData ?? []) as Photo[];
    setRecipes(rList);
    setPhotos(pList);
    setUrls(await signedUrls(pList.map((p) => p.storage_path)));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const photoByKey = useMemo(() => {
    const m = new Map<string, Photo>();
    for (const p of photos) {
      const k = p.recipe_key || recipeKey(p.recipe_title);
      if (!m.has(k)) m.set(k, p);
    }
    return m;
  }, [photos]);

  const recipeKeys = useMemo(() => new Set((recipes ?? []).map((r) => recipeKey(r.title))), [recipes]);
  const extraPhotos = useMemo(() => photos.filter((p) => !recipeKeys.has(p.recipe_key || recipeKey(p.recipe_title))), [photos, recipeKeys]);

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter((r) => {
      const hasPhoto = photoByKey.has(recipeKey(r.title));
      if (tab === "com_foto") return hasPhoto;
      if (tab === "sem_foto") return !hasPhoto;
      return true;
    });
  }, [recipes, photoByKey, tab]);

  async function removeRecipe(id: string) {
    if (!confirm("Tirar esta receita da pasta?")) return;
    const { error } = await supabase.from("saved_recipes").delete().eq("id", id);
    if (error) { toast.error("Não consegui tirar agora."); return; }
    toast.success("Receita tirada da pasta.");
    void load();
  }

  return (
    <AppShell title="📁 Receitas e Fotos">
      <p className="mb-4 text-lg text-muted-foreground">
        Todas as receitas geradas pela ZELFA vêm automaticamente para esta pasta. Fotografe seu prato no cartão da receita para deixar a foto e a receita sempre juntas! 💛
      </p>
      <div role="group" aria-label="Filtrar pasta" className="mb-5 flex flex-wrap gap-2">
        {([
          ["todas", `📁 Todas (${recipes?.length ?? 0})`],
          ["com_foto", "📸 Com foto"],
          ["sem_foto", "🍳 Sem foto ainda"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`rounded-full border-2 px-4 py-2 text-base font-semibold ${tab === key ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!recipes ? (
        <p className="text-lg text-muted-foreground">Abrindo sua pasta…</p>
      ) : !filteredRecipes.length && !(tab !== "sem_foto" && extraPhotos.length) ? (
        <p className="rounded-3xl bg-card p-6 text-lg shadow-soft">
          {tab === "com_foto"
            ? "Você ainda não fotografou nenhum prato. Toque em 📸 FOTOGRAFEI MEU PRATO dentro de uma receita 💛"
            : "Sua pasta ainda está vazia. Peça uma receita para a ZELFA na conversa que ela já vem automaticamente para cá! 🍳💛"}
        </p>
      ) : (
        <>
          {RECIPE_CATEGORIES.map((c) => {
            const list = filteredRecipes.filter((r) => r.category === c);
            if (!list.length) return null;
            return (
              <section key={c} className="mb-6">
                <h2 className="mb-2 text-2xl font-bold">
                  {CATEGORY_LABEL[c]} <span className="text-base font-normal text-muted-foreground">({list.length})</span>
                </h2>
                {list.map((r) => {
                  const p = photoByKey.get(recipeKey(r.title));
                  return (
                    <div key={r.id} className="mb-4">
                      {p && <p className="mb-1 text-sm font-semibold text-primary">{STATUS[p.status] ?? p.status}</p>}
                      <RecipeCardView
                        saved
                        recipe={{ title: r.title, minutes: r.minutes, level: r.level, category: r.category as RecipeCategory, markdown: r.markdown }}
                        onDelete={() => void removeRecipe(r.id)}
                      />
                    </div>
                  );
                })}
              </section>
            );
          })}

          {tab !== "sem_foto" && extraPhotos.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-2xl font-bold">📸 Outras fotos do seu álbum</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {extraPhotos.map((p) => (
                  <figure key={p.id} className="overflow-hidden rounded-3xl border-2 border-gold bg-card shadow-soft">
                    {urls[p.storage_path] ? <img src={urls[p.storage_path]} alt={p.recipe_title} className="aspect-square w-full object-cover" loading="lazy" /> : <div className="aspect-square bg-muted" />}
                    <figcaption className="p-3">
                      <b className="block leading-tight">{p.recipe_title}</b>
                      <span className="block text-sm text-muted-foreground">{CATEGORY_LABEL[p.category as RecipeCategory] ?? p.category} · {new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                      <span className="block text-sm">{STATUS[p.status] ?? p.status}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}
