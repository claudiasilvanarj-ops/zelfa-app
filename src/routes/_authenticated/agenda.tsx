import { useServerFn } from "@tanstack/react-start";
import { emailShoppingList } from "@/lib/notice-email.functions";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES } from "@/lib/zelfa-prompts";
import { groupShopping, shoppingEstimate, brl, marketNotes, MARKET_SECTORS } from "@/lib/shopping";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/agenda")({
  staticData: { sitemap: false },
  validateSearch: z.object({ aba: z.enum(["agenda", "compras", "semana"]).optional() }),
  head: () => ({
    meta: [
      { title: "Agenda e compras — ZELFA | eXPLIK@ das Galáxias" },
      { name: "description", content: "Planejamento doméstico semanal, compromissos, lembretes e compras com a ZELFA." },
      { property: "og:title", content: "Agenda e compras — ZELFA | eXPLIK@ das Galáxias" },
      { property: "og:description", content: "Organize seu dia com a ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const [{ data: appts }, { data: items }] = await Promise.all([
      supabase.from("appointments").select("*").or(`starts_at.gte.${since.toISOString()},repeat_daily.eq.true,and(household_task.eq.true,done.eq.false)`).order("starts_at"),
      supabase.from("shopping_items").select("*").order("checked").order("created_at", { ascending: false }),
    ]);
    return { appts: appts ?? [], items: items ?? [] };
  },
  component: Agenda,
});

const CAT_EMOJI: Record<string, string> = { Escola: "🎒", "Reuniões": "👥", Mercado: "🛒", Consultas: "🩺", "Aniversários": "🎂", "Remédios": "💊", Lembretes: "📌" };

function Agenda() {
  const { aba } = Route.useSearch();
  const { appts, items } = Route.useLoaderData();
  const router = useRouter();
  const mailList = useServerFn(emailShoppingList);
  const [tab, setTab] = useState(aba ?? "agenda");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<string>("Lembretes");
  const [when, setWhen] = useState("");
  const [daily, setDaily] = useState(false);
  const [item, setItem] = useState("");
  const [sector, setSector] = useState<string>("Mercearia");
  const estimate = shoppingEstimate(items);
  const refresh = () => router.invalidate();

  async function addAppt(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !when) return;
    const { error } = await supabase.from("appointments").insert({ title, category: cat, starts_at: new Date(when).toISOString(), repeat_daily: daily, notes: cat === "Mercado" ? marketNotes(null, items) : null });
    if (error) { toast.error("Não consegui salvar."); return; }
    setTitle(""); setWhen(""); setDaily(false);
    toast.success("Anotado! 📌");
    refresh();
  }
  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim()) return;
    const { error } = await supabase.from("shopping_items").insert({ name: item.trim(), sector });
    if (error) { toast.error("Não consegui salvar."); return; }
    setItem("");
    refresh();
  }

  const groups = new Map<string, typeof appts>();
  for (const a of appts) {
    const k = a.repeat_daily ? "Todos os dias" : new Date(a.starts_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long" });
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  const field = "w-full rounded-2xl border-2 border-input bg-card px-4 py-3 text-lg";

  return (
    <AppShell title="🗓️ Agenda">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {(["agenda", "semana", "compras"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "secondary" : "ghost"} onClick={() => setTab(t)} className="h-auto min-w-0 whitespace-normal px-2 py-3 text-base font-bold" aria-pressed={tab === t}>
            {t === "agenda" ? "Compromissos" : t === "semana" ? "Casa na semana" : "Compras"}
          </Button>
        ))}
      </div>

      {tab === "semana" ? (
        <section className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">🏡 Casa na semana</h2>
            <Button asChild><Link to="/conversa" search={{ iniciar: "ZELFA, quero planejar as tarefas da casa nesta semana, sem sobrecarregar um dia. Vamos combinar as tarefas e meus horários?" }}>Planejar com a ZELFA</Link></Button>
          </div>
          <Button asChild variant="outline" className="h-auto whitespace-normal py-3"><Link to="/conversa" search={{ iniciar: "ZELFA, minha rotina mudou. Quero ajustar meus dias e horários disponíveis e reorganizar as tarefas da casa." }}>Ajustar minha rotina</Link></Button>
          <p className="text-sm text-muted-foreground">Avisos e ajustes de pendências enquanto o app estiver aberto. Tempos aproximados.</p>
          {appts.filter((a) => a.household_task && !a.done).length === 0 && <p className="py-5 text-lg text-muted-foreground">Nenhuma tarefa da casa pendente. 💛</p>}
          {[...groups].map(([day, list]) => {
            const tasks = list.filter((a) => a.household_task && !a.done);
            if (!tasks.length) return null;
            return <section key={day}>
              <h3 className="mb-2 text-lg font-bold capitalize text-primary">{day} · {tasks.reduce((sum, t) => sum + t.duration_minutes, 0)} min</h3>
              <ul className="space-y-2">{tasks.map((task) => <li key={task.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h4 className="break-words text-lg font-bold">{task.title}</h4><p className="text-muted-foreground">{new Date(task.starts_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })} · {task.task_kind} · cerca de {task.duration_minutes} min</p></div>
                  <Button size="icon" variant="secondary" aria-label={`Concluir ${task.title}`} onClick={async () => { const { error } = await supabase.from("appointments").update({ done: true }).eq("id", task.id); if (error) toast.error("Não consegui marcar como feita."); else { toast.success("Isso! Você é demais! 🎉"); refresh(); } }}><Check className="h-5 w-5" /></Button>
                </div>
                {task.category === "Mercado" && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{marketNotes(null, items.filter((i) => !i.checked))}</p>}
                <Link to="/conversa" search={{ iniciar: `ZELFA, quero adiar a tarefa ${task.title} (ID ${task.id}). Pergunte qual dia é melhor e reorganize sem sobrecarga.` }} className="mt-3 inline-block font-bold text-primary">Deixar para outro dia</Link>
              </li>)}</ul>
            </section>;
          })}
        </section>
      ) : tab === "agenda" ? (
        <>
          <Link to="/conversa" search={{ iniciar: "ZELFA, quero marcar um compromisso." }} className="mt-4 block rounded-[1.75rem] bg-warm p-5 shadow-soft">
            <b className="block text-xl">💬 Fale com a ZELFA para agendar</b>
            <span className="text-foreground/80">Ex.: "reunião da escola segunda às 19h" — pode escrever ou falar. Pergunte também: "quando estou livre na quinta?"</span>
          </Link>
          {"Notification" in globalThis && typeof Notification !== "undefined" && Notification.permission !== "granted" && (
            <button onClick={() => Notification.requestPermission().then(() => refresh())} className="mt-3 flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-bold text-gold-foreground">
              <Bell className="h-5 w-5" /> Ativar avisos neste aparelho
            </button>
          )}
          <form onSubmit={addAppt} className="mt-4 space-y-3 rounded-[1.75rem] bg-card p-5 shadow-soft">
            <h2 className="text-xl font-bold">Ou anote aqui</h2>
            <input className={field} placeholder="O que é?" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={field} value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className={field} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
            </div>
            <label className="flex items-center gap-3 text-lg"><input type="checkbox" className="h-6 w-6 accent-primary" checked={daily} onChange={(e) => setDaily(e.target.checked)} /> Repetir todos os dias (ex.: remédio)</label>
            <button className="w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground">Salvar</button>
          </form>
          <div className="mt-5 space-y-5">
            {appts.length === 0 && <p className="text-center text-lg text-muted-foreground">Nenhum compromisso por enquanto. 🌸</p>}
            {[...groups].map(([day, list]) => (
              <div key={day}>
                <h3 className="mb-2 text-lg font-bold capitalize text-primary">{day}</h3>
                <ul className="space-y-2">
                  {list.map((a) => (
                    <li key={a.id} className={`flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft ${a.done ? "opacity-50" : ""}`}>
                      <span className="text-3xl">{CAT_EMOJI[a.category] ?? "📌"}</span>
                      <div className="flex-1">
                        <div className="text-lg font-bold">{a.title}</div>
                        <div className="text-muted-foreground">
                          {new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.category}{a.location ? ` · ${a.location}` : ""}
                          {a.household_task ? ` · cerca de ${a.duration_minutes} min` : ""}
                        </div>
                        {a.category === "Mercado" && a.notes && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.notes}</p>}
                      </div>
                      <button aria-label="Feito" onClick={async () => { await supabase.from("appointments").update({ done: !a.done }).eq("id", a.id); refresh(); }} className="rounded-full bg-secondary p-3"><Check className="h-5 w-5" /></button>
                      <button aria-label="Apagar" onClick={async () => { await supabase.from("appointments").delete().eq("id", a.id); refresh(); }} className="rounded-full p-3 text-destructive"><Trash2 className="h-5 w-5" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-lg text-muted-foreground">Os ingredientes que faltam nas receitas da ZELFA entram aqui sozinhos. 🛒</p>
          <form onSubmit={addItem} className="mt-3 flex flex-wrap gap-2">
            <input className={field} placeholder="Adicionar item..." value={item} onChange={(e) => setItem(e.target.value)} />
            <select aria-label="Setor do mercado" className="min-w-0 flex-1 rounded-2xl border-2 border-input bg-card px-4 py-3 text-lg" value={sector} onChange={(e) => setSector(e.target.value)}>{MARKET_SECTORS.map((s) => <option key={s}>{s}</option>)}</select>
            <Button type="submit" className="h-auto px-6 font-bold">Pôr</Button>
          </form>
          {items.length > 0 && <div className="mt-4 space-y-1">
            <p className="text-lg font-bold">Total estimado: {brl(estimate.total)}{estimate.missing > 0 ? ` + ${estimate.missing} item(ns) sem estimativa` : ""}</p>
            <p className="text-sm text-muted-foreground">Preços aproximados; variam por loja, cidade e embalagem.</p>
            <p className="text-muted-foreground">Compare o preço por quilo ou litro, confira marcas próprias, promoções e produtos da estação.</p>
            <Link to="/conversa" search={{ iniciar: "ZELFA, quero agendar minha ida ao mercado com a lista de compras." }} className="mt-2 inline-block font-bold text-primary">🗓️ Agendar ida ao mercado</Link>
          </div>}
          {items.length === 0 && <p className="mt-4 text-center text-lg text-muted-foreground">Lista vazia!</p>}
          {groupShopping(items).map((group) => <section key={group.sector} className="mt-5">
            <h3 className="mb-2 text-lg font-bold text-primary">{group.sector}</h3>
            <ul className="space-y-2">
            {group.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <input type="checkbox" className="h-7 w-7 accent-primary" checked={i.checked} onChange={async () => { await supabase.from("shopping_items").update({ checked: !i.checked }).eq("id", i.id); refresh(); }} />
                <div className={`min-w-0 flex-1 ${i.checked ? "text-muted-foreground line-through" : ""}`}><span className="text-lg">{i.name}{i.quantity ? ` — ${i.quantity}` : ""}</span><p className="text-sm text-muted-foreground">{i.estimated_price != null ? `Cerca de ${brl(i.estimated_price)}` : "Preço a confirmar"}</p></div>
                <button aria-label="Apagar" onClick={async () => { await supabase.from("shopping_items").delete().eq("id", i.id); refresh(); }} className="p-2 text-destructive"><Trash2 className="h-5 w-5" /></button>
              </li>
            ))}
            </ul>
          </section>)}
          {items.some((i) => i.checked) && (
            <button onClick={async () => { await supabase.from("shopping_items").delete().eq("checked", true); refresh(); }} className="mt-4 font-bold text-primary">Limpar itens comprados</button>
          )}
          {items.some((i) => !i.checked) && (<Button variant="outline" className="mt-4 h-12 w-full text-lg" onClick={async () => { const t = toast.loading("Enviando para o seu e-mail..."); try { const r = await mailList(); toast.success(`Lista enviada para ${r.sentTo} 💛`, { id: t }); } catch { toast.error("Não consegui enviar agora. Tente de novo em instantes.", { id: t }); } }}>📧 RECEBER LISTA POR E-MAIL</Button>)}
        </>
      )}
    </AppShell>
  );
}
