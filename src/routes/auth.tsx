import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { markFreshLogin } from "@/lib/access";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import avatar from "@/assets/zelfa-avatar.png";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: z.object({ modo: z.enum(["entrar", "criar"]).optional() }),
  head: () => ({
    meta: [
      { title: "Entrar na ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Entre ou crie sua conta para conversar com a ZELFA." },
      { property: "og:title", content: "Entrar na ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Crie sua conta e ganhe uma chef em casa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { modo } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar">(modo ?? "criar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "criar") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
        });
        if (error) throw error;
        setSent(true);
      } else {
        markFreshLogin();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/inicio" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha não conferem." : msg.includes("weak") ? "Essa senha é muito fácil de adivinhar. Escolha outra mais forte." : msg.includes("not confirmed") ? "Confirme seu e-mail primeiro: abra o link que enviamos. 💌" : "Não deu certo agora. " + msg);
    } finally {
      setBusy(false);
    }
  }

  async function social() {
    markFreshLogin();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/inicio` },
    });
    if (error) { toast.error("Não consegui entrar com o Google agora. Tente com e-mail e senha?"); }
  }

  async function forgot() {
    if (!email) { toast("Digite seu e-mail primeiro."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error("Não consegui enviar agora.");
    else toast.success("Enviei um link para seu e-mail. 💌");
  }

  const input = "w-full rounded-2xl border-2 border-input bg-card px-4 py-4 text-lg outline-none focus:border-primary";

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
        <img src={avatar} alt="ZELFA" width={816} height={816} className="mx-auto -mt-20 w-32" />
        {sent ? (
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold">Quase lá! 💌</h1>
            <p className="text-lg">Mandei um link para <b>{email}</b>. Abra seu e-mail e toque no link para ativar sua conta.</p>
            <button className="font-bold text-primary underline" onClick={() => { setSent(false); setMode("entrar"); }}>Já confirmei, quero entrar</button>
          </div>
        ) : (
          <>
            <h1 className="text-center text-3xl font-bold">{mode === "criar" ? "Vamos nos conhecer?" : "Que bom te ver de novo!"}</h1>
            <aside aria-label="Uso individual da conta" className="mt-5 border-l-4 border-accent bg-secondary p-4 text-secondary-foreground">
              <p className="font-bold">💛 1 conta por pessoa · 1 aparelho por vez</p>
              <p className="mt-2 text-sm">Não compartilhe seu login e senha. Usar a conta em outro aparelho sem fazer a troca pode bloquear a entrada nesse aparelho.</p>
              <p className="mt-2 text-sm">Precisa mudar? Use <strong>TROCAR DE APARELHO</strong> na tela de acesso: são até <strong>2 trocas por mês</strong>, e o aparelho anterior será desconectado.</p>
            </aside>
            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "criar" && (
                <input className={input} placeholder="Como posso te chamar?" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <input className={input} type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <input className={input} type="password" placeholder="Sua senha (mínimo 6 letras)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button disabled={busy} className="w-full rounded-full bg-primary py-4 text-xl font-bold text-primary-foreground disabled:opacity-60">
                {busy ? "Só um instante..." : mode === "criar" ? "Criar minha conta" : "Entrar"}
              </button>
            </form>
            {mode === "entrar" && (
              <button onClick={forgot} className="mt-3 w-full text-center font-semibold text-muted-foreground underline">Esqueci minha senha</button>
            )}
            <div className="my-5 text-center text-muted-foreground">ou</div>
            <div className="space-y-3">
              <button onClick={() => social()} className="w-full rounded-full border-2 border-input bg-card py-4 text-lg font-bold">
                Continuar com Google
              </button>
            </div>
            <button onClick={() => setMode(mode === "criar" ? "entrar" : "criar")} className="mt-6 w-full text-center text-lg font-bold text-primary">
              {mode === "criar" ? "Já tenho conta — entrar" : "Ainda não tenho conta — criar"}
            </button>
          </>
        )}
        <p className="mt-6 text-center text-muted-foreground">Precisa de ajuda? <a href="mailto:zelfaapp@gmail.com" className="font-bold text-primary underline">zelfaapp@gmail.com</a></p>
      </div>
    </main>
  );
}
