import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildCaption, postTitle, signedUrls } from "@/lib/dish-community";
import { CATEGORY_LABEL, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/recipes";

type Row = { id: string; recipe_title: string; recipe_markdown?: string | null; first_name: string; category: string; storage_path: string; share_consent: boolean; status: string; caption: string | null; created_at: string };

export function CommunityPhotosAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [cat, setCat] = useState("");
  const [from, setFrom] = useState("");
  const [status, setStatus] = useState("");
  const [openRecipe, setOpenRecipe] = useState<Record<string, boolean>>({});
  const load = useCallback(async () => {
    const { data } = await supabase.from("community_photos").select("*").order("created_at", { ascending: false }).limit(300);
    const d = (data ?? []) as Row[];
    setRows(d); setUrls(await signedUrls(d.map((r) => r.storage_path)));
  }, []);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => rows.filter((r) => (!cat || r.category === cat) && (!status || r.status === status) && (!from || r.created_at >= from)), [rows, cat, from, status]);

  async function approve(r: Row) {
    const { error } = await supabase.rpc("admin_approve_photo", { _id: r.id, _caption: buildCaption(r.first_name, r.recipe_title) });
    if (error) { toast.error("Não consegui aprovar."); return; }
    toast.success("Foto aprovada! Legenda pronta 💛"); load();
  }

  const sel = "rounded-xl border-2 border-border bg-background px-3 py-2";
  return (
    <section className="rounded-[1.75rem] bg-card p-5 shadow-soft">
      <h2 className="text-2xl font-bold text-primary">FOTOS E RECEITAS DA COMUNIDADE</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <select aria-label="Categoria" className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {RECIPE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select aria-label="Situação" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option><option value="pendente">Pendentes</option><option value="aprovada">Aprovadas</option><option value="privada">Privadas (sem autorização)</option>
        </select>
        <label className="flex items-center gap-2">Desde <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      </div>
      {!shown.length ? <p className="mt-3 text-muted-foreground">Nenhuma foto por aqui.</p> : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <article key={r.id} className="overflow-hidden rounded-2xl border-2 border-gold">
              {urls[r.storage_path] ? <a href={urls[r.storage_path]} target="_blank" rel="noreferrer" download><img src={urls[r.storage_path]} alt={r.recipe_title} className="aspect-square w-full object-cover" loading="lazy" /></a> : <div className="aspect-square bg-muted" />}
              <div className="space-y-1 p-3">
                <b className="block">{postTitle(r.recipe_title, r.first_name)}</b>
                <span className="block text-sm text-muted-foreground">{CATEGORY_LABEL[r.category as RecipeCategory] ?? r.category} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="block text-sm font-semibold">{r.status === "pendente" ? "⏳ Pendente" : r.status === "aprovada" ? "✅ Aprovada" : "🔒 Privada — sem autorização para Instagram"}</span>
                {r.recipe_markdown && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setOpenRecipe((o) => ({ ...o, [r.id]: !o[r.id] }))}
                      className="text-sm font-bold text-primary underline"
                    >
                      {openRecipe[r.id] ? "Ocultar receita" : "📖 Ver receita completa"}
                    </button>
                    {openRecipe[r.id] && (
                      <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted p-2 text-xs">
                        {r.recipe_markdown}
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(r.recipe_markdown!).then(() => toast.success("Receita copiada!"))}
                          className="mt-2 block font-bold text-primary underline"
                        >
                          📋 Copiar receita
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {r.status === "pendente" && <button onClick={() => approve(r)} className="mt-2 w-full rounded-xl bg-accent px-3 py-2 font-bold text-accent-foreground">Aprovar para o Instagram</button>}
                {r.caption && (
                  <div className="mt-2 rounded-xl bg-muted p-2 text-sm">
                    <p>{r.caption}</p>
                    <button onClick={() => navigator.clipboard.writeText(r.caption!).then(() => toast.success("Legenda copiada!"))} className="mt-1 font-bold text-primary underline">Copiar legenda</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
