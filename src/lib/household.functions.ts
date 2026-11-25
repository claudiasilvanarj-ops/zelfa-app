import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reorganizeHousehold } from "./household.server";

export const reconcileHousehold = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  return reorganizeHousehold(context.supabase, context.userId);
});