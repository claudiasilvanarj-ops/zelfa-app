import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const emailSavedRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) throw new Error("Sua conta não tem e-mail.");
    const { data: r, error } = await context.supabase.from("saved_recipes").select("title,markdown").eq("id", data.id).maybeSingle();
    if (error || !r) throw new Error("Receita não encontrada.");
    const { buildRecipeEmail, sendGmailRaw } = await import("./notice-email");
    await sendGmailRaw(buildRecipeEmail(email, r.title, r.markdown));
    return { sentTo: email };
  });

export const emailShoppingList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) throw new Error("Sua conta não tem e-mail.");
    const { data, error } = await context.supabase.from("shopping_items").select("name,quantity,sector,estimated_price,checked");
    if (error) throw new Error("Não consegui ler a lista.");
    const { marketListText } = await import("./shopping");
    const { buildRecipeEmail, sendGmailRaw } = await import("./notice-email");
    await sendGmailRaw(buildRecipeEmail(email, "Sua lista de compras", marketListText(data ?? [])));
    return { sentTo: email };
  });
