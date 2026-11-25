import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { signedUrls } from "@/lib/dish-community";
import { CATEGORY_LABEL, type RecipeCategory } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/album")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Álbum da Cozinha — ZELFA" },
      { name: "description", content: "Os pratos que você já fez com a ZELFA, com as suas próprias fotos." },
      { property: "og:title", content: "Álbum da Cozinha — ZELFA" },
      { property: "og:description", content: "Galeria dos seus pratos feitos com a ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Album,
});

type Photo = { id: string; recipe_title: string; category: string; storage_path: string; status: string; created_at: string };
const STATUS: Record<string, string> = { privada: "🔒 Só para você", pendente: "⏳ Aguardando a Sil", aprovada: "⭐ Aprovada para o Instagram" };

function Album() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from("community_photos").select("id,recipe_title,category,storage_path,status,created_at").order("created_at", { ascending: false })
      .then(async ({ data }) => { const d = (data ?? []) as Photo[]; setPhotos(d); setUrls(await signedUrls(d.map((p) => p.storage_path))); });
  }, []);
  return (
    <AppShell title="📸 Álbum da Cozinha">
      {!photos ? <p className="text-lg text-muted-foreground">Abrindo seu álbum…</p> : !photos.length ? (
        <p className="rounded-3xl bg-card p-6 text-lg shadow-soft">Seu álbum ainda está vazio. Quando fizer uma receita da ZELFA, toque em <b>📸 FOTOGRAFEI MEU PRATO</b> no cartão dela 💛</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((p) => (
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
      )}
    </AppShell>
  );
}
