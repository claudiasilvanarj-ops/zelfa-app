import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PreferencePicker } from "@/components/PreferencePicker";

export const Route = createFileRoute("/_authenticated/perfil")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Meu Perfil — ZELFA" },
      { name: "description", content: "Sua preferência alimentar: a ZELFA adapta todas as receitas a ela." },
      { property: "og:title", content: "Meu Perfil — ZELFA" },
      { property: "og:description", content: "Preferência alimentar usada em todas as receitas da ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.from("dietary_restrictions").select("preference,notes").maybeSingle();
    return { preference: data?.preference ?? null, notes: data?.notes ?? null };
  },
  component: Perfil,
});

function Perfil() {
  const { preference, notes } = Route.useLoaderData();
  const router = useRouter();
  return (
    <AppShell title="👤 Meu Perfil">
      <p className="mb-4 text-lg">Qual é a sua preferência alimentar? 💛 Todas as receitas da ZELFA seguem essa escolha.</p>
      <PreferencePicker current={preference} notes={notes} onSaved={() => router.invalidate()} />
      <Link to="/restricoes" className="mt-6 block text-center text-lg font-semibold text-primary underline">⚠️ Marcar alergias e intolerâncias</Link>
    </AppShell>
  );
}
