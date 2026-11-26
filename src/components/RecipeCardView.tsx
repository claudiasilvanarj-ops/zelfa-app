import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { speak } from "@/lib/voice";
import { essentialSpeech } from "@/lib/voice-rules";
import { CATEGORY_LABEL } from "@/lib/recipes";
import { ingredientName, recipeParts, type RecipeCard } from "@/lib/recipe-cards";
import { myPhotoFor } from "@/lib/dish-community";
import { DishPhotoButton } from "@/components/DishPhotoButton";
import { StepTimer } from "@/components/StepTimer";
import { stepSeconds } from "@/lib/timers";
import { recipeTypeBadge } from "@/lib/diet";

export function RecipeCardView({ recipe, onDelete, saved }: { recipe: RecipeCard; onDelete?: () => void; saved?: boolean }) {
  const [open, setOpen] = useState(!saved);
  const [busy, setBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(!!saved);
  const [added, setAdded] = useState(false);
  const parts = useMemo(() => recipeParts(recipe.markdown), [recipe.markdown]);
  const [own, setOwn] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { myPhotoFor(recipe.title).then(setOwn).catch(() => {}); }, [recipe.title, tick]);
  const [intro, setIntro] = useState(false);
  useEffect(() => { if (!saved && !localStorage.getItem("zelfa-photo-intro")) setIntro(true); const off = () => setIntro(false); window.addEventListener("zelfa-photo-intro", off); return () => window.removeEventListener("zelfa-photo-intro", off); }, [saved]);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("saved_recipes").insert({ title: recipe.title, category: recipe.category, minutes: recipe.minutes, level: recipe.level, markdown: recipe.markdown });
    setBusy(false);
    if (error) { toast.error("Não consegui salvar agora."); return; }
    setIsSaved(true);
    toast.success("Receita salva no seu caderno! 💛");
  }

  async function addToList() {
    if (!parts.ingredients.length) { toast.error("Não achei os ingredientes desta receita."); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); toast.error("Entre na sua conta para usar a lista."); return; }
    const userId = u.user.id;
    const rows = parts.ingredients.map((i) => ({ ...ingredientName(i), user_id: userId }));
    const { error } = await supabase.from("shopping_items").insert(rows);
    setBusy(false);
    if (error) { toast.error("Não consegui colocar na lista agora."); return; }
    setAdded(true);
    toast.success(`${rows.length} itens na sua lista de compras! 🛒💛`);
  }

  return (
    <>
    {intro && (
      <div role="status" className="my-3 rounded-3xl border-2 border-accent bg-card p-5 shadow-soft">
        <p className="text-lg">A partir de agora, suas receitas vêm sem foto — porque a foto mais bonita é a do SEU prato! 📸 Cozinhe, fotografe e monte seu Álbum da Cozinha. Você também pode compartilhar com a Comunidade ZELFA 💛</p>
        <button type="button" onClick={() => { localStorage.setItem("zelfa-photo-intro", "1"); setIntro(false); window.dispatchEvent(new Event("zelfa-photo-intro")); }} className="mt-3 rounded-2xl bg-accent px-5 py-3 text-lg font-bold text-accent-foreground">ENTENDI! 🍳</button>
      </div>
    )}
    <article className="my-3 overflow-hidden rounded-3xl border-2 border-gold bg-card text-card-foreground shadow-soft">
      <div className="relative">
        {own ? (
          <img src={own} alt={`Seu prato: ${recipe.title}`} width={1024} height={640} loading="lazy" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 bg-primary p-6 text-center text-primary-foreground">
            <span className="text-6xl" aria-hidden>📸</span>
            <p className="max-w-sm font-display text-xl leading-snug">Fotografe seu prato e guarde no seu Álbum da Cozinha 💛</p>
            <DishPhotoButton title={recipe.title} category={recipe.category} markdown={recipe.markdown} onDone={() => setTick((t) => t + 1)} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-sm font-bold text-primary-foreground">{CATEGORY_LABEL[recipe.category]}</span>
      </div>
      <div className="p-4 sm:p-6">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open}>
          <span>
            <b className="block font-display text-2xl leading-tight sm:text-3xl">{recipe.title}</b>
            {recipeTypeBadge([recipe.title, ...parts.ingredients]) && <span className="mt-1 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{recipeTypeBadge([recipe.title, ...parts.ingredients])}</span>}
            <span className="mt-1 block text-base text-muted-foreground">
              {recipe.minutes ? `⏱️ ${recipe.minutes} min` : "⏱️ rapidinho"}
              {parts.servings ? ` · 🍽️ ${parts.servings} porções` : ""}
              {recipe.level ? ` · ${recipe.level}` : ""}
            </span>
          </span>
          {open ? <ChevronUp className="mt-1 h-6 w-6 shrink-0" /> : <ChevronDown className="mt-1 h-6 w-6 shrink-0" />}
        </button>

        {open && (parts.ingredients.length || parts.steps.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <section>
              <h4 className="mb-2 text-lg font-bold">🧺 Ingredientes</h4>
              <ul className="space-y-2">
                {parts.ingredients.map((i, n) => (
                  <li key={n} className="flex gap-2 text-lg"><Check className="mt-1 h-5 w-5 shrink-0 text-accent" />{i}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="mb-2 text-lg font-bold">👩‍🍳 Modo de preparo</h4>
              <ol className="space-y-3">
                {parts.steps.map((s, n) => (
                  <li key={n} className="flex gap-3 text-lg">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{n + 1}</span>
                    <span className="flex-1">{s}{stepSeconds(s) > 0 && <StepTimer recipe={recipe.title} category={recipe.category} step={s} seconds={stepSeconds(s)} />}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : (
          <div className="prose prose-lg mt-3 max-w-none border-t pt-3 text-inherit [&_*]:text-inherit">
            <ReactMarkdown>{recipe.markdown.replace(/^#{2,4}\s.*\n?/, "")}</ReactMarkdown>
          </div>
        ))}

        <button type="button" disabled={busy || added} onClick={addToList} className="mt-5 w-full rounded-2xl bg-accent px-4 py-3 text-lg font-bold text-accent-foreground shadow-soft disabled:opacity-70">
          {added ? "✅ Na sua lista de compras" : "ADICIONAR À LISTA DE COMPRAS 🛒"}
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          {!saved && (
            <button type="button" disabled={busy || isSaved} onClick={save} className="rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-60">
              {isSaved ? "✅ Salva" : "💾 SALVAR"}
            </button>
          )}
          {own && <DishPhotoButton title={recipe.title} category={recipe.category} markdown={recipe.markdown} onDone={() => setTick((t) => t + 1)} />}
          <button type="button" onClick={() => speak(essentialSpeech(recipe.markdown))} className="rounded-full border-2 border-accent px-4 py-2 font-bold">▶️ OUVIR</button>
          {onDelete && <button type="button" onClick={onDelete} aria-label="Tirar do caderno" className="ml-auto rounded-full px-3 py-2 text-muted-foreground hover:bg-muted"><Trash2 className="h-5 w-5" /></button>}
        </div>
        {own && <p className="mt-3 text-sm text-muted-foreground">📸 Foto do seu prato 💛</p>}
      </div>
    </article>
    </>
  );
}
