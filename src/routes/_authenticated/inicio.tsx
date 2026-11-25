import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic, Send, Settings, ShoppingBasket, Shield, Users, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { FEATURES } from "@/lib/features";
import { CATEGORIES, PREFERENCE_QUESTION } from "@/lib/diet";
import { PreferencePicker } from "@/components/PreferencePicker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { greetOnDemand, greetOncePerVisit, useSpeechInput } from "@/lib/voice";
import avatar from "@/assets/zelfa-avatar.png";

export const Route = createFileRoute("/_authenticated/inicio")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Início — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Seu dia com a ZELFA: atalhos, compromissos de hoje e conversa." },
      { property: "og:title", content: "Início — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Seu dia com a ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 864e5);
    const [{ data: user }, { data: today }, { data: daily }, { count }, { data: isAdmin }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("appointments").select("id,title,starts_at,category").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at"),
      supabase.from("appointments").select("id,title,starts_at,category").eq("repeat_daily", true),
      supabase.from("shopping_items").select("id", { count: "exact", head: true }).eq("checked", false),
      supabase.rpc("has_role", { _user_id: (await supabase.auth.getUser()).data.user?.id ?? "", _role: "admin" }),
    ]);
    const { data: diet } = await supabase.from("dietary_restrictions").select("preference").maybeSingle();
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.user?.id ?? "").maybeSingle();
    const items = [...(today ?? []), ...(daily ?? []).filter((d) => !(today ?? []).some((t) => t.id === d.id))].sort((a, b) => {
      const ta = new Date(a.starts_at); const tb = new Date(b.starts_at);
      return ta.getHours() * 60 + ta.getMinutes() - (tb.getHours() * 60 + tb.getMinutes());
    });
    return { name: profile?.display_name ?? "chef", items, shopping: count ?? 0, isAdmin: Boolean(isAdmin), askPreference: !diet?.preference };
  },
  component: Inicio,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
const greetEmoji = () => { const h = new Date().getHours(); return h < 12 ? "☀️" : h < 18 ? "🌤️" : "🌙"; };

function Inicio() {
  const { name, items, shopping, isAdmin, askPreference } = Route.useLoaderData();
  const [askOpen, setAskOpen] = useState(askPreference);
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const mic = useSpeechInput((t) => navigate({ to: "/conversa", search: { iniciar: t } }));
  useEffect(() => {
    // Saudação automática só depois do primeiro toque nesta sessão (navegadores bloqueiam áudio antes disso).
    return greetOncePerVisit();
  }, []);

  return (
    <AppShell back={false} title="ZELFA" wide>
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{PREFERENCE_QUESTION}</DialogTitle>
            <DialogDescription className="text-lg">Dá para mudar quando quiser em Meu Perfil 👤</DialogDescription>
          </DialogHeader>
          <PreferencePicker current={null} notes={null} onSaved={() => setAskOpen(false)} />
        </DialogContent>
      </Dialog>
      <section className="flex items-center gap-4 rounded-[2rem] bg-warm p-5 text-primary-foreground shadow-soft sm:p-7">
        <img src={avatar} alt="ZELFA" width={816} height={816} className="h-24 w-24 sm:h-32 sm:w-32" />
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">{greeting()}, {name}! {greetEmoji()}</h2>
          <p className="mt-1 flex items-center gap-2 text-xl text-gold">
            Olá! Que bom te ver! 💛 Vamos cozinhar hoje? 🍳
            <button type="button" aria-label="Ouvir a saudação da Quel" title="Ouvir a Quel" onClick={(e) => { e.stopPropagation(); greetOnDemand(); }} className="rounded-full p-1 opacity-80 hover:opacity-100"><Volume2 className="h-5 w-5" /></button>
          </p>
        </div>
      </section>
      <p className="mt-4 text-lg text-muted-foreground">Pode escrever ou falar no microfone 🎤 o que você tem em casa.</p>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) navigate({ to: "/conversa", search: { iniciar: text.trim() } });
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva para a ZELFA..." className="min-w-0 flex-1 rounded-full border-2 border-input bg-card px-5 py-4 text-lg outline-none focus:border-primary" />
        {mic.supported && (
          <button type="button" onClick={mic.start} aria-label="Falar" className={`rounded-full p-4 ${mic.listening ? "animate-pulse bg-live text-live-foreground" : "bg-gold text-gold-foreground"}`}>
            <Mic className="h-7 w-7" />
          </button>
        )}
        <button aria-label="Enviar" className="rounded-full bg-primary p-4 text-primary-foreground"><Send className="h-7 w-7" /></button>
      </form>

      <section className="mt-6 grid grid-cols-1 gap-3">
        {FEATURES.map((f) => (
          <Link
            key={f.key}
            to={f.to}
            search={f.mode ? { modo: f.mode, ...(f.starter ? { iniciar: f.starter } : {}) } : {}}
            className={`${f.tile} flex min-h-36 flex-col justify-between rounded-[1.75rem] p-4 shadow-soft transition-transform active:scale-95`}
          >
            <span className="text-5xl">{f.emoji}</span>
            <span>
              <span className="block font-display text-xl font-semibold leading-tight">{f.title}</span>
              <span className="block text-sm text-foreground/75">{f.desc}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Categorias">
        {CATEGORIES.map((c) => {
          const cls = `${c.tile} flex min-h-32 flex-col justify-between rounded-[1.5rem] p-4 shadow-soft transition-transform active:scale-95`;
          const inner = (<><span className="text-4xl">{c.emoji}</span><span><span className="block font-display text-lg font-semibold leading-tight">{c.title}</span><span className="block text-sm text-foreground/75">{c.desc}</span></span></>);
          if (c.to === "/restricoes") return <Link key={c.key} to="/restricoes" className={cls}>{inner}</Link>;
          if (c.to === "/agenda") return <Link key={c.key} to="/agenda" search={{ aba: "compras" }} className={cls}>{inner}</Link>;
          return <Link key={c.key} to="/conversa" search={{ modo: "comida", iniciar: c.starter, ...(c.categoria ? { categoria: c.categoria } : {}) }} className={cls}>{inner}</Link>;
        })}
      </section>

      <section className="mt-6 grid gap-4">
        <div className="grid gap-3">
          <Link to="/agenda" search={{ aba: "compras" }} className="flex items-center gap-4 rounded-[1.75rem] bg-card p-5 shadow-soft">
            <ShoppingBasket className="h-10 w-10 text-primary" />
            <span><b className="block text-xl">Lista de compras</b><span className="text-muted-foreground">{shopping} {shopping === 1 ? "item" : "itens"} para comprar</span></span>
          </Link>

          <Link to="/caderno" className="flex items-center gap-4 rounded-[1.75rem] bg-card p-5 shadow-soft">
            <span className="text-4xl">📖</span>
            <span><b className="block text-xl">Meu caderno de receitas</b><span className="text-muted-foreground">Receitas salvas, por categoria</span></span>
          </Link>

          <Link to="/album" className="flex items-center gap-4 rounded-[1.75rem] bg-card p-5 shadow-soft">
            <span className="text-4xl">📸</span>
            <span><b className="block text-xl">Álbum da Cozinha</b><span className="text-muted-foreground">Os pratos que você já fez</span></span>
          </Link>

          <Link to="/comunidade" className="flex items-center gap-4 rounded-[1.75rem] border-2 border-accent bg-primary p-5 text-primary-foreground shadow-soft">
            <span className="text-4xl">💛</span>
            <span><b className="block text-xl">COMUNIDADE 💛</b><span className="opacity-90">Mostre seu prato no @universozelfa · #ZelfaChef</span></span>
          </Link>

          <Link to="/configuracoes" className="flex items-center gap-4 rounded-[1.75rem] bg-card p-5 shadow-soft">
            <Settings className="h-10 w-10 text-primary" />
            <span><b className="block text-xl">Configurações da voz</b><span className="text-muted-foreground">Ligar, desligar e velocidade da fala</span></span>
          </Link>

          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-4 rounded-[1.75rem] bg-card p-5 shadow-soft">
              <Shield className="h-10 w-10 text-primary" />
              <span><b className="block text-xl">Painel de administração</b><span className="text-muted-foreground">Usuárias e compromissos</span></span>
            </Link>
          )}
        </div>
      </section>
    </AppShell>
  );
}
