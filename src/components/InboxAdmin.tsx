import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listInbox } from "@/lib/inbox.functions";
import type { InboxMessage } from "@/lib/inbox";

export function InboxAdmin() {
  const fn = useServerFn(listInbox);
  const [msgs, setMsgs] = useState<InboxMessage[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () => { setMsgs(null); fn().then((r) => { setMsgs(r.messages); setErr(r.error); }).catch(() => { setMsgs([]); setErr("Não consegui ler o e-mail agora."); }); };
  useEffect(load, []);
  return (
    <section className="rounded-[1.75rem] bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-primary">📬 RECADOS RECEBIDOS — zelfaapp@gmail.com</h2>
        <button onClick={load} className="rounded-full border px-4 py-1 font-bold">Atualizar</button>
      </div>
      {msgs === null ? <p className="mt-3">Carregando...</p> : err ? <p className="mt-3 text-destructive">{err}</p> : !msgs.length ? <p className="mt-3">Nenhum recado na caixa de entrada.</p> : (
        <ul className="mt-3 divide-y">
          {msgs.map((m) => (
            <li key={m.id} className="py-3">
              <a href={`https://mail.google.com/mail/u/0/#inbox/${m.id}`} target="_blank" rel="noreferrer" className="block">
                <p className={m.unread ? "font-bold" : ""}>{m.unread && "🟢 "}{m.subject}</p>
                <p className="text-sm text-muted-foreground">{m.from} · {m.date ? new Date(m.date).toLocaleString("pt-BR") : ""}</p>
                <p className="text-sm">{m.snippet}</p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
