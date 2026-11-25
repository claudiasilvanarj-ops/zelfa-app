// Separa uma resposta da ZELFA em texto solto + receitas (cards). Seguro para o navegador.
import { CATEGORY_LABEL, RECIPES, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/recipes";

export type RecipeCard = { title: string; minutes: number | null; level: string | null; category: RecipeCategory; markdown: string };
export type Piece = { kind: "text"; markdown: string } | { kind: "recipe"; recipe: RecipeCard };

const SWEET = /(açúcar|acucar|chocolate|leite condensado|pudim|mousse|sorvete|sorbet|bolo|brigadeiro|doce|torta de limão|calda|beijinho|pavê|cocada)/i;

export function guessCategory(title: string, body: string): RecipeCategory {
  const bank = RECIPES.find((r) => r.name.toLowerCase() === title.toLowerCase());
  if (bank) return bank.category;
  for (const c of RECIPE_CATEGORIES) if (body.includes(CATEGORY_LABEL[c])) return c;
  if (/✅ Vegano/.test(body)) return "vegano";
  if (SWEET.test(title)) return "doces";
  if (/✅ Sem glúten/.test(body)) return "sem_gluten";
  return "dia_a_dia";
}

export function splitRecipes(markdown: string): Piece[] {
  const sections = markdown.split(/^(?=#{2,4}\s)/m);
  const out: Piece[] = [];
  for (const sec of sections) {
    const first = sec.split("\n")[0] ?? "";
    const isRecipe = /^#{2,4}\s/.test(first) && /ingredientes/i.test(sec) && /(preparo|modo de fazer)/i.test(sec);
    if (!isRecipe) {
      if (sec.trim()) out.push({ kind: "text", markdown: sec });
      continue;
    }
    // Texto final depois da última receita (ex.: "Qual você prefere?") fica fora do card.
    const title = first.replace(/^#+\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/\*\*/g, "").trim();
    const minutes = Number(sec.match(/(\d+)\s*min/i)?.[1]) || null;
    const level = sec.match(/(?<![a-zà-ú])(muito fácil|fácil|facil|médio|medio|difícil|dificil)(?![a-zà-ú])/i)?.[1] ?? null;
    out.push({ kind: "recipe", recipe: { title, minutes, level: level ? level[0]!.toUpperCase() + level.slice(1) : null, category: guessCategory(title, sec), markdown: sec.trim() } });
  }
  return out;
}

const clean = (s: string) => s.replace(/^\s*(?:[-*•✅✔️]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim();

/** Lê porções, ingredientes e passos de uma receita em texto. */
export function recipeParts(markdown: string) {
  const lines = markdown.split("\n");
  const ingredients: string[] = [];
  const steps: string[] = [];
  let mode: "none" | "ing" | "steps" = "none";
  for (const raw of lines.slice(1)) {
    const l = raw.trim();
    if (!l) continue;
    const head = l.replace(/[*#_:]/g, "").trim().toLowerCase();
    if (/^(🛒\s*)?ingredientes/.test(head.replace(/^[^\p{L}]+/u, ""))) { mode = "ing"; continue; }
    if (/^(modo de preparo|preparo|modo de fazer|passo a passo)/.test(head.replace(/^[^\p{L}]+/u, ""))) { mode = "steps"; continue; }
    if (/^#{2,4}\s|^\*\*[^*]+\*\*:?$/.test(l) && mode !== "none") { mode = "none"; continue; }
    const isItem = /^\s*(?:[-*•✅✔️]|\d+[.)])\s+/.test(l);
    if (mode === "ing" && isItem) ingredients.push(clean(l));
    else if (mode === "steps" && isItem) steps.push(clean(l));
  }
  const servings = Number(markdown.match(/(\d+)\s*(por[çc][õo]es|pessoas|serve)/i)?.[1] ?? markdown.match(/(?:rende|serve)\s*(\d+)/i)?.[1]) || null;
  return { ingredients, steps, servings };
}

/** Tira a quantidade do ingrediente para ir à lista de compras ("2 ovos" -> "ovos"). */
export function ingredientName(item: string): { name: string; quantity: string | null } {
  const m = item.match(/^([\d½¼¾/.,]+\s*(?:x[íi]caras?|colher(?:es)?(?: de (?:sopa|chá|cha))?|g|kg|ml|l|litros?|unidades?|dentes?|pitadas?|latas?|pacotes?|fatias?|ma[çc]os?|copos?)?)\s*(?:de\s+)?(.+)$/i);
  const name = (m ? m[2]! : item).split(/[(,]/)[0]!.trim();
  return { name: name || item, quantity: m ? m[1]!.trim() : null };
}

/** Quantas mensagens ficam visíveis antes de "ver mensagens anteriores". */
export const VISIBLE_MESSAGES = 6;
