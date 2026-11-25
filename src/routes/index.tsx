import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Endereço principal (zelfa.app): quem já entrou vai direto para o app;
// quem ainda não tem conta cai na tela de entrar/criar conta em /auth.
// A página de vendas fica em /pagdevendas.
export const Route = createFileRoute("/")({
  staticData: { sitemap: false },
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/inicio" });
    throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "ZELFA — Entre no app da sua Chef Virtual" },
      {
        name: "description",
        content:
          "Fale ou escreva o que tem na geladeira e receba receitas na hora com a ZELFA, sua chef de cozinha virtual.",
      },
      { property: "og:title", content: "ZELFA — Entre no app da sua Chef Virtual" },
      { property: "og:description", content: "Entre na ZELFA para cozinhar com receitas, lista de compras e orientação no preparo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
