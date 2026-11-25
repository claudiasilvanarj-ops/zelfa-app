import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { speak } from "@/lib/voice";
import { marketListText } from "@/lib/shopping";
import { reconcileHousehold } from "@/lib/household.functions";
import { useServerFn } from "@tanstack/react-start";

const KEY = "zelfa-notified";

/** Avisa na hora do compromisso e 1 dia antes, enquanto o app estiver aberto. */
export function useReminders() {
  const reconcile = useServerFn(reconcileHousehold);
  useEffect(() => {
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
      try {
        const changes = await reconcile();
        if (changes.length) toast("Ajustei as tarefas pendentes na sua agenda.");
      } catch (error) { console.error("Falha ao reorganizar tarefas", error); }
      const now = Date.now();
      const { data } = await supabase
        .from("appointments")
        .select("id,title,starts_at,repeat_daily,category,household_task,duration_minutes")
        .eq("done", false)
        .lte("starts_at", new Date(now + 864e5 + 60e3).toISOString());
      const { data: items } = await supabase.from("shopping_items").select("name,quantity,sector,estimated_price").eq("checked", false);
      let seen: Record<string, true> = {};
      try { seen = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { /* recover malformed notification storage */ }
      for (const a of data ?? []) {
        let t = new Date(a.starts_at).getTime();
        if (a.repeat_daily) {
          const s = new Date(a.starts_at);
          const today = new Date();
          today.setHours(s.getHours(), s.getMinutes(), 0, 0);
          t = today.getTime();
        }
        const alerts: Array<[string, number, string]> = [[`${a.id}-${t}-now`, t, `Está na hora: ${a.title}${a.household_task ? `, cerca de ${a.duration_minutes} minutos` : ""}`]];
        if (!a.repeat_daily) alerts.push([`${a.id}-${t}-before`, t - 864e5, `Amanhã: ${a.title}`]);
        for (const [k, when, msg] of alerts) {
          if (seen[k] || now < when || now - when > 30 * 60e3) continue;
          seen[k] = true;
          const extra = a.category === "Mercado" ? ` ${marketListText(items ?? [])}` : "";
          const text = `${msg}.${extra}`;
          toast(`🔔 ${text}`, { duration: 20000 });
          if (document.documentElement.dataset['cameraNight'] !== 'true') {
            if ("Notification" in window && Notification.permission === "granted") new Notification("ZELFA lembra você 💛", { body: text, icon: "/icon-192.png" });
            speak(text);
          }
        }
      }
      localStorage.setItem(KEY, JSON.stringify(seen));
      } catch (error) { console.error("Falha ao conferir lembretes", error); }
      finally { checking = false; }
    };
    void check();
    const id = setInterval(check, 60e3);
    return () => clearInterval(id);
  }, [reconcile]);
}
