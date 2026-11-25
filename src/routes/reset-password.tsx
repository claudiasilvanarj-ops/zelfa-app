import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Nova senha — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Crie uma nova senha para sua conta ZELFA." },
      { property: "og:title", content: "Nova senha — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Crie uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-warm px-4">
      <form
        className="w-full max-w-md space-y-4 rounded-[2rem] bg-card p-8 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) { toast.error("Não deu certo: " + error.message); return; }
          toast.success("Senha nova salva! 💛");
          navigate({ to: "/inicio" });
        }}
      >
        <h1 className="text-3xl font-bold">Crie sua nova senha</h1>
        <input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha" className="w-full rounded-2xl border-2 border-input bg-card px-4 py-4 text-lg" />
        <button className="w-full rounded-full bg-primary py-4 text-xl font-bold text-primary-foreground">Salvar</button>
      </form>
    </main>
  );
}
