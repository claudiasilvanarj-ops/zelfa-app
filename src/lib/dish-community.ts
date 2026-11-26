// Fotos reais dos pratos das usuárias. Regras puras + envio (navegador).
import { supabase } from "@/integrations/supabase/client";
import { RECIPES } from "@/lib/recipes";

export const BUCKET = "dish-photos";

export const recipeKey = (title: string) => title.trim().toLowerCase().replace(/\s+/g, " ");

/** Receita oficial = está no banco fixo da ZELFA. Essas nunca recebem foto da pessoa usuária. */
export function isOfficialRecipe(title: string): boolean {
  const k = recipeKey(title);
  return RECIPES.some((r) => recipeKey(r.name) === k);
}

export function firstName(name: string | null | undefined): string {
  const f = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return f ? f[0]!.toUpperCase() + f.slice(1).toLowerCase() : "Chef";
}

export function postTitle(recipe: string, name: string) {
  return `${recipe} por ${firstName(name)} 💛`;
}

export function buildCaption(name: string, recipe: string): string {
  return `Olha o que ${firstName(name)} fez com a ZELFA! 💛🍳 ${recipe} — faça o seu também: zelfa.app`;
}

/** Status inicial: só entra na fila do Instagram com autorização (LGPD). */
export const initialStatus = (consent: boolean) => (consent ? "pendente" : "privada");

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("foto"))), "image/jpeg", 0.85));
}

export async function uploadDishPhoto(file: File, recipe: { title: string; category: string; markdown?: string }, consent: boolean) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("login");
  const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
  const path = `${u.user.id}/${crypto.randomUUID()}.jpg`;
  const blob = await shrink(file);
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) throw up.error;
  const payload: Record<string, unknown> = {
    recipe_title: recipe.title, recipe_key: recipeKey(recipe.title), category: recipe.category,
    first_name: firstName(prof?.display_name), storage_path: path, share_consent: consent, status: initialStatus(consent),
  };
  if (recipe.markdown) payload.recipe_markdown = recipe.markdown;
  const { error } = await supabase.from("community_photos").insert(payload as never);
  if (error) { await supabase.storage.from(BUCKET).remove([path]); throw error; }
}

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}

export async function myPhotoFor(title: string): Promise<string | null> {
  const { data } = await supabase.from("community_photos").select("storage_path").eq("recipe_key", recipeKey(title)).order("created_at", { ascending: false }).limit(1);
  const p = data?.[0]?.storage_path;
  if (!p) return null;
  return (await signedUrls([p]))[p] ?? null;
}
