import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdmin } from "@/lib/admin.functions";
import { isOnline, newSubscribersByWeek, salesByDay, SOURCE_LABEL, toCsv, type VisitSource } from "@/lib/admin";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InboxAdmin } from "@/components/InboxAdmin";
import { CommunityPhotosAdmin } from "@/components/CommunityPhotosAdmin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  ssr: false,
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Área administrativa — ZELFA" },
      { name: "description", content: "Painel privado da ZELFA: vendas, clientes, visitantes e acessos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Área administrativa — ZELFA" },
      { property: "og:description", content: "Painel privado da ZELFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(verifyAdmin);
  const [state, setState] = useState<"loading" | "login" | "ok">("loading");

  const verify = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setState("login"); return; }
    const r = await check().catch(() => ({ ok: false }));
    if (r.ok) { setState("ok"); return; }
    toast.error("Acesso não autorizado.");
    navigate({ to: "/", replace: true });
  }, [check, navigate]);

  useEffect(() => { void verify(); }, [verify]);

  if (state === "loading") return <div className="flex min-h-screen items-center justify-center text-xl text-muted-foreground">Verificando acesso…</div>;
  if (state === "login") return <AdminLogin onDone={verify} />;
  return <Dashboard onExit={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }} />;
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      await supabase.rpc("log_admin_attempt", { _email: email, _reason: "senha incorreta" });
      toast.error("Login inválido.");
      navigate({ to: "/", replace: true });
      return;
    }
    onDone();
  }
  const input = "w-full rounded-2xl border-2 border-input bg-card px-4 py-3 text-lg outline-none focus:border-primary";
  return (
    <main className="flex min-h-screen items-center justify-center bg-warm px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-[2rem] border-2 border-gold bg-card p-8 shadow-soft">
        <h1 className="text-center text-3xl font-bold text-primary">🛡️ Área administrativa</h1>
        <p className="text-center text-muted-foreground">Acesso exclusivo da administração ZELFA.</p>
        <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className={input} type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        <button disabled={busy} className="w-full rounded-full bg-primary py-3 text-xl font-bold text-primary-foreground disabled:opacity-60">{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}

type Data = Awaited<ReturnType<typeof loadData>>;

async function loadData() {
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const [profiles, access, payments, visits, visitsTotal, sessions, admin, events, attempts] = await Promise.all([
    supabase.from("profiles").select("id,display_name,email,phone,created_at"),
    supabase.from("account_access").select("user_id,paid_until"),
    supabase.from("payments").select("user_id,amount_cents,paid_at").order("paid_at"),
    supabase.from("site_visits").select("visitor_id,user_id,path,source,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    supabase.from("site_visits").select("visitor_id", { count: "exact", head: true }),
    supabase.from("app_sessions").select("user_id,started_at,last_seen").order("last_seen", { ascending: false }).limit(2000),
    supabase.from("customer_admin").select("*"),
    supabase.from("customer_events").select("user_id,kind,detail,created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("admin_login_attempts").select("email,reason,created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const switches = await supabase.from("device_switches").select("email,old_label,new_label,old_device,new_device,created_at").order("created_at", { ascending: false }).limit(200);
  return {
    profiles: profiles.data ?? [], access: access.data ?? [], payments: payments.data ?? [], visits: visits.data ?? [],
    visitsTotal: visitsTotal.count ?? 0, sessions: sessions.data ?? [], admin: admin.data ?? [], events: events.data ?? [], attempts: attempts.data ?? [],
    switches: switches.data ?? [],
  };
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");
const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PIE = ["var(--primary)", "var(--accent)", "var(--gold)", "var(--muted-foreground)", "var(--secondary)"];

function download(name: string, rows: Record<string, unknown>[]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Dashboard({ onExit }: { onExit: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const reload = useCallback(() => { loadData().then(setData); }, []);
  useEffect(() => { reload(); const t = setInterval(reload, 30000); return () => clearInterval(t); }, [reload]);
  if (!data) return <div className="flex min-h-screen items-center justify-center text-xl text-muted-foreground">Carregando painel…</div>;
  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="bg-warm px-5 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">🛡️ ZELFA — <span className="text-gold">Administração</span></h1>
          <button onClick={onExit} className="rounded-full border-2 border-gold px-5 py-2 font-bold text-gold">Sair</button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
        <Indicators data={data} />
        <Charts data={data} />
        <Clients data={data} reload={reload} />
        <Leads data={data} />
        <InboxAdmin />
        <CommunityPhotosAdmin />
        <section className="rounded-[1.75rem] bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold text-primary">ACESSOS — trocas de aparelho</h2>
          {data.switches.length ? (
            <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm">
              <thead><tr className="text-muted-foreground"><th className="p-2">E-mail</th><th className="p-2">Data</th><th className="p-2">Aparelho antigo</th><th className="p-2">Aparelho novo</th></tr></thead>
              <tbody>{data.switches.map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-2">{s.email || "—"}</td><td className="p-2">{fmtDateTime(s.created_at)}</td>
                  <td className="p-2">{s.old_label || "Aparelho"} <span className="text-xs text-muted-foreground">({s.old_device?.slice(0, 8) ?? "—"})</span></td>
                  <td className="p-2">{s.new_label || "Aparelho"} <span className="text-xs text-muted-foreground">({s.new_device.slice(0, 8)})</span></td>
                </tr>))}</tbody>
            </table></div>
          ) : <p className="mt-2 text-muted-foreground">Nenhuma troca de aparelho ainda.</p>}
        </section>
        <section className="rounded-[1.75rem] bg-card p-5 shadow-soft">
          <h2 className="text-xl font-bold text-primary">Tentativas de acesso bloqueadas</h2>
          {data.attempts.length ? (
            <ul className="mt-2 space-y-1 text-sm">{data.attempts.map((a, i) => <li key={i}>{fmtDateTime(a.created_at)} — {a.email || "sem e-mail"} — {a.reason}</li>)}</ul>
          ) : <p className="mt-2 text-muted-foreground">Nenhuma tentativa bloqueada.</p>}
        </section>
      </div>
    </main>
  );
}

function Indicators({ data }: { data: Data }) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const visitorsToday = new Set(data.visits.filter((v) => new Date(v.created_at).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) === today).map((v) => v.visitor_id)).size;
  const active = data.access.filter((a) => a.paid_until && new Date(a.paid_until) > new Date()).length;
  const month = new Date().toISOString().slice(0, 7);
  const revenue = data.payments.filter((p) => p.paid_at.slice(0, 7) === month).reduce((s, p) => s + p.amount_cents / 100, 0);
  const online = new Set(data.sessions.filter((s) => isOnline(s.last_seen)).map((s) => s.user_id)).size;
  const items: [string, string, string][] = [
    ["👀", `${visitorsToday} / ${data.visitsTotal}`, "Visitantes hoje / páginas vistas no total"],
    ["💛", String(active), "Assinantes ativos"],
    ["💰", brl(revenue), "Receita do mês"],
    ["🟢", String(online), "No app agora (5 min)"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([e, n, t]) => (
        <div key={t} className="rounded-[1.75rem] border-2 border-gold/40 bg-card p-5 shadow-soft">
          <div className="text-3xl">{e}</div>
          <div className="mt-1 text-3xl font-bold text-primary">{n}</div>
          <div className="text-sm text-muted-foreground">{t}</div>
        </div>
      ))}
    </div>
  );
}

function Charts({ data }: { data: Data }) {
  const sales = useMemo(() => salesByDay(data.payments), [data]);
  const weeks = useMemo(() => newSubscribersByWeek(data.payments), [data]);
  const sources = useMemo(() => {
    const first = new Map<string, VisitSource>();
    for (const v of [...data.visits].reverse()) if (!first.has(v.visitor_id)) first.set(v.visitor_id, v.source as VisitSource);
    const count: Record<string, number> = {};
    for (const s of first.values()) count[s] = (count[s] ?? 0) + 1;
    return Object.entries(count).map(([k, v]) => ({ name: SOURCE_LABEL[k as VisitSource] ?? k, value: v }));
  }, [data]);
  const box = "rounded-[1.75rem] bg-card p-5 shadow-soft";
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${box} lg:col-span-2`}>
        <h2 className="text-xl font-bold text-primary">Vendas por dia (30 dias)</h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer><LineChart data={sales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="dia" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => brl(v)} /><Line type="monotone" dataKey="valor" stroke="var(--accent)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </div>
      </section>
      <section className={box}>
        <h2 className="text-xl font-bold text-primary">Visitantes por origem</h2>
        <div className="mt-3 h-64">
          {sources.length ? (
            <ResponsiveContainer><PieChart><Pie data={sources} dataKey="value" nameKey="name" outerRadius={80} label>{sources.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          ) : <p className="text-muted-foreground">Ainda sem visitas registradas.</p>}
        </div>
      </section>
      <section className={`${box} lg:col-span-3`}>
        <h2 className="text-xl font-bold text-primary">Novos assinantes por semana</h2>
        <div className="mt-3 h-56">
          <ResponsiveContainer><BarChart data={weeks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="semana" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="novos" fill="var(--gold)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Clients({ data, reload }: { data: Data; reload: () => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [from, setFrom] = useState("");
  const rows = useMemo(() => data.profiles.map((p) => {
    const until = data.access.find((a) => a.user_id === p.id)?.paid_until;
    const firstPay = data.payments.find((x) => x.user_id === p.id)?.paid_at ?? null;
    const last = data.sessions.find((s) => s.user_id === p.id)?.last_seen ?? null;
    const adm = data.admin.find((a) => a.user_id === p.id);
    return { id: p.id, nome: p.display_name ?? "", email: p.email ?? "", telefone: p.phone ?? "", assinatura: firstPay ?? p.created_at, ativo: !!until && new Date(until) > new Date(), ultimo: last, brinde: adm?.gift_sent ?? false, notas: adm?.notes ?? "" };
  }), [data]);
  const shown = rows.filter((r) =>
    (!q || `${r.nome} ${r.email} ${r.telefone}`.toLowerCase().includes(q.toLowerCase())) &&
    (status === "todos" || (status === "ativo") === r.ativo) &&
    (!from || r.assinatura.slice(0, 10) >= from));

  async function cancel(id: string) {
    const { error } = await supabase.rpc("admin_cancel_subscription", { _user: id });
    if (error) toast.error("Não deu certo."); else { toast.success("Assinatura cancelada."); reload(); }
  }
  async function grant(id: string) {
    const { error } = await supabase.rpc("admin_grant_access", { _user: id, _days: 31 });
    if (error) toast.error("Não deu certo."); else { toast.success("Acesso liberado por 31 dias."); reload(); }
  }

  return (
    <section className="overflow-x-auto rounded-[1.75rem] bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-primary">CLIENTES</h2>
        <button onClick={() => download("clientes-zelfa.csv", shown.map((r) => ({ nome: r.nome, email: r.email, telefone: r.telefone, data_assinatura: fmtDate(r.assinatura), status: r.ativo ? "ativo" : "cancelado", ultimo_acesso: fmtDateTime(r.ultimo), brinde_enviado: r.brinde ? "sim" : "não", anotacao: r.notas })))} className="rounded-full bg-accent px-4 py-2 font-bold text-accent-foreground">⬇️ Exportar CSV</button>
      </div>
      <Filters q={q} setQ={setQ} status={status} setStatus={setStatus} statusOptions={[["todos", "Todos"], ["ativo", "Ativos"], ["cancelado", "Cancelados"]]} from={from} setFrom={setFrom} />
      <table className="mt-3 w-full min-w-[860px] text-left text-sm">
        <thead><tr className="text-muted-foreground"><th className="py-2">Nome</th><th>E-mail</th><th>Telefone</th><th>Assinatura</th><th>Status</th><th>Último acesso</th><th>Brinde</th><th>Ações</th></tr></thead>
        <tbody>{shown.map((r) => (
          <tr key={r.id} className="border-t align-top">
            <td className="py-2 font-semibold">{r.nome || "—"}</td><td>{r.email}</td><td>{r.telefone || "—"}</td><td>{fmtDate(r.assinatura)}</td>
            <td>{r.ativo ? "✅ Ativo" : "⛔ Cancelado"}</td><td>{fmtDateTime(r.ultimo)}</td>
            <td><GiftEditor id={r.id} sent={r.brinde} notes={r.notas} reload={reload} /></td>
            <td className="space-x-1 whitespace-nowrap">
              <History id={r.id} name={r.nome || r.email} events={data.events} />
              {r.ativo ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild><button className="rounded-full border border-destructive px-3 py-1 text-destructive">Cancelar</button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Cancelar a assinatura de {r.nome || r.email}?</AlertDialogTitle><AlertDialogDescription>O acesso ao app é bloqueado na hora. Você pode liberar de novo depois.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={() => cancel(r.id)}>Sim, cancelar</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : <button onClick={() => grant(r.id)} className="rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">Liberar 31 dias</button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
      {!shown.length && <p className="mt-3 text-muted-foreground">Nenhum cliente com esses filtros.</p>}
    </section>
  );
}

function GiftEditor({ id, sent, notes, reload }: { id: string; sent: boolean; notes: string; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(sent);
  const [n, setN] = useState(notes);
  async function save() {
    const { error } = await supabase.rpc("admin_set_gift", { _user: id, _sent: s, _notes: n });
    if (error) toast.error("Não deu certo."); else { toast.success("Anotação salva."); setOpen(false); reload(); }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setS(sent); setN(notes); } }}>
      <DialogTrigger asChild><button className="rounded-full border px-3 py-1">{sent ? "🎁 Enviado" : "Marcar"}</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Brinde de fidelização</DialogTitle></DialogHeader>
        <label className="flex items-center gap-2 text-lg"><input type="checkbox" checked={s} onChange={(e) => setS(e.target.checked)} className="h-5 w-5" /> Brinde enviado</label>
        <textarea value={n} onChange={(e) => setN(e.target.value)} placeholder="Anotação (ex.: enviado pelo WhatsApp em 10/11)" className="min-h-24 w-full rounded-2xl border-2 border-input p-3" maxLength={1000} />
        <button onClick={save} className="rounded-full bg-primary py-3 font-bold text-primary-foreground">Salvar</button>
      </DialogContent>
    </Dialog>
  );
}

const KIND: Record<string, string> = { comprou: "💰 Comprou", acessou: "📱 Acessou o app", cancelou: "⛔ Cancelou", brinde: "🎁 Brinde enviado" };

function History({ id, name, events }: { id: string; name: string; events: Data["events"] }) {
  const mine = events.filter((e) => e.user_id === id);
  return (
    <Dialog>
      <DialogTrigger asChild><button className="rounded-full border px-3 py-1">Histórico</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Histórico de {name}</DialogTitle></DialogHeader>
        {mine.length ? <ul className="max-h-80 space-y-1 overflow-y-auto">{mine.map((e, i) => <li key={i} className="border-b py-1">{fmtDateTime(e.created_at)} — {KIND[e.kind] ?? e.kind}{e.detail ? ` (${e.detail})` : ""}</li>)}</ul> : <p className="text-muted-foreground">Nenhum evento registrado ainda.</p>}
      </DialogContent>
    </Dialog>
  );
}

function Leads({ data }: { data: Data }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState("todos");
  const [from, setFrom] = useState("");
  const rows = useMemo(() => {
    const by = new Map<string, { visitante: string; contato: string; data: string; paginas: Set<string>; origem: string }>();
    for (const v of data.visits) {
      const r = by.get(v.visitor_id) ?? { visitante: v.visitor_id.slice(0, 8), contato: "", data: v.created_at, paginas: new Set<string>(), origem: v.source };
      r.paginas.add(v.path);
      if (v.created_at < r.data) { r.data = v.created_at; r.origem = v.source; }
      if (v.user_id && !r.contato) { const p = data.profiles.find((x) => x.id === v.user_id); r.contato = [p?.email, p?.phone].filter(Boolean).join(" / "); }
      by.set(v.visitor_id, r);
    }
    return [...by.values()].sort((a, b) => b.data.localeCompare(a.data));
  }, [data]);
  const shown = rows.filter((r) =>
    (!q || `${r.contato} ${[...r.paginas].join(" ")}`.toLowerCase().includes(q.toLowerCase())) &&
    (source === "todos" || r.origem === source) && (!from || r.data.slice(0, 10) >= from));
  return (
    <section className="overflow-x-auto rounded-[1.75rem] bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-primary">LEADS / VISITANTES <span className="text-base font-normal text-muted-foreground">(últimos 90 dias)</span></h2>
        <button onClick={() => download("visitantes-zelfa.csv", shown.map((r) => ({ contato: r.contato, data_visita: fmtDateTime(r.data), paginas: [...r.paginas].join(" | "), origem: SOURCE_LABEL[r.origem as VisitSource] ?? r.origem })))} className="rounded-full bg-accent px-4 py-2 font-bold text-accent-foreground">⬇️ Exportar CSV</button>
      </div>
      <Filters q={q} setQ={setQ} status={source} setStatus={setSource} statusOptions={[["todos", "Todas as origens"], ...Object.entries(SOURCE_LABEL)]} from={from} setFrom={setFrom} />
      <table className="mt-3 w-full min-w-[700px] text-left text-sm">
        <thead><tr className="text-muted-foreground"><th className="py-2">E-mail / telefone</th><th>Primeira visita</th><th>Páginas</th><th>Origem</th></tr></thead>
        <tbody>{shown.slice(0, 300).map((r) => <tr key={r.visitante} className="border-t"><td className="py-2">{r.contato || <span className="text-muted-foreground">Visitante {r.visitante}</span>}</td><td>{fmtDateTime(r.data)}</td><td>{[...r.paginas].join(", ")}</td><td>{SOURCE_LABEL[r.origem as VisitSource] ?? r.origem}</td></tr>)}</tbody>
      </table>
      {!shown.length && <p className="mt-3 text-muted-foreground">Nenhum visitante com esses filtros.</p>}
    </section>
  );
}

function Filters(p: { q: string; setQ: (v: string) => void; status: string; setStatus: (v: string) => void; statusOptions: [string, string][]; from: string; setFrom: (v: string) => void }) {
  const c = "rounded-2xl border-2 border-input bg-background px-3 py-2";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <input className={`${c} min-w-48 flex-1`} placeholder="🔎 Buscar" value={p.q} onChange={(e) => p.setQ(e.target.value)} />
      <select className={c} value={p.status} onChange={(e) => p.setStatus(e.target.value)}>{p.statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <label className="flex items-center gap-1 text-sm text-muted-foreground">A partir de <input type="date" className={c} value={p.from} onChange={(e) => p.setFrom(e.target.value)} /></label>
    </div>
  );
}
