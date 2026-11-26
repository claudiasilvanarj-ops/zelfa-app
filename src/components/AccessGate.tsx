import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAccess, switchDevice, isFreshLogin, clearFreshLogin, type AccessStatus } from "@/lib/access";
import { ANNUAL_PRICE, ANNUAL_INSTALLMENTS, ANNUAL_INSTALLMENT_PRICE, ANNUAL_INSTALLMENT_TOTAL, PAYMENT_LINK } from "@/lib/payment";
import { appHeartbeat } from "@/lib/tracking";

/** Blocks the members area until payment is confirmed and enforces 1 active device at a time. */
export function AccessGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccessStatus | "loading" | "switch" | "cooldown">("loading");
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const s = await checkAccess();
        if (!alive) return;
        if (s === "other_device" && isFreshLogin()) { setStatus((p) => (p === "cooldown" ? p : "switch")); return; }
        if (s === "other_device") {
          toast.error("Sua conta foi aberta em outro aparelho. Como o acesso é individual (1 por vez), saímos daqui. 💛");
          await supabase.auth.signOut({ scope: "local" });
          navigate({ to: "/auth", replace: true });
          return;
        }
        setStatus(s);
        if (s === "ok") appHeartbeat();
      } catch { /* keep current state on network hiccups */ }
    };
    run();
    const t = setInterval(run, 30000);
    window.addEventListener("focus", run);
    return () => { alive = false; clearInterval(t); window.removeEventListener("focus", run); };
  }, [navigate]);

  async function doSwitch() {
    setBusy(true);
    try {
      const r = await switchDevice();
      if (r === "cooldown" || r === "limit") setStatus("cooldown");
      else {
        toast.success("Pronto! Este aparelho está ativo agora e o anterior foi desconectado 🍳");
        const s = await checkAccess();
        setStatus(s === "other_device" ? "switch" : s);
      }
    } catch { toast.error("Não consegui ativar este aparelho agora. Tente de novo?"); }
    setBusy(false);
  }

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center text-xl text-muted-foreground">Carregando… 🍳</div>;
  if (status === "ok") return <>{children}</>;
  if (status === "switch" || status === "cooldown") return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="max-w-md rounded-[2rem] border-2 border-gold bg-card p-8 text-center shadow-soft">
        <p className="text-5xl">📱💛</p>
        {status === "switch" ? <>
          <h1 className="mt-3 text-2xl font-bold text-primary">Seu acesso funciona em 1 aparelho por vez</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Esta conta já está aberta em outro aparelho. Se quiser usar aqui agora, <strong>o outro aparelho será desconectado na hora</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Por isso, não compartilhe sua senha: sempre que outra pessoa entrar, você perde o acesso no seu aparelho.
          </p>
          <button onClick={doSwitch} disabled={busy} className="mt-5 w-full rounded-full bg-accent px-8 py-4 text-xl font-bold text-accent-foreground shadow-soft disabled:opacity-60">
            {busy ? "Ativando..." : "✅ USAR AQUI AGORA 🍳"}
          </button>
        </> : <>
          <h1 className="mt-3 text-2xl font-bold text-primary">Muitas trocas de aparelho hoje</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Por segurança contra compartilhamento de conta, aguarde <strong>1 hora</strong> para ativar outro aparelho.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            O plano da ZELFA é individual e funciona em apenas 1 aparelho por vez. 💛
          </p>
        </>}
        <div><button onClick={async () => { clearFreshLogin(); await supabase.auth.signOut({ scope: "local" }); navigate({ to: "/auth", replace: true }); }} className="mt-5 text-sm underline">Sair</button></div>
      </div>
    </main>
  );
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="max-w-md rounded-[2rem] border-2 border-gold bg-card p-8 text-center shadow-soft">
        <p className="text-5xl">👩‍🍳🔒</p>
        <h1 className="mt-3 text-3xl font-bold text-primary">Falta só ativar sua assinatura</h1>
        <p className="mt-3 text-lg text-muted-foreground">Assim que o pagamento for confirmado, a ZELFA libera tudo para você.</p>
        <p className="mt-4 text-4xl font-bold text-primary">{ANNUAL_PRICE}<span className="text-lg text-muted-foreground">/ano</span></p>
        <p className="mt-2 text-xl font-bold text-primary">ou até {ANNUAL_INSTALLMENTS}x de {ANNUAL_INSTALLMENT_PRICE}</p>
        <p className="mt-2 text-sm text-muted-foreground">Parcelamento com acréscimo: total de {ANNUAL_INSTALLMENT_TOTAL}. Renovação anual automática até cancelar.</p>
        <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-full bg-accent px-8 py-4 text-xl font-bold text-accent-foreground shadow-soft">ASSINAR ANUAL 💛</a>
        <p className="mt-4 text-sm text-muted-foreground">Já pagou? Esta tela se atualiza sozinha. Cada conta funciona em 1 aparelho por vez.</p>
        <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="mt-3 text-sm underline">Sair</button>
      </div>
    </main>
  );
}
