import { useState } from "react";
import { toast } from "sonner";
import { CAPTION, DIRECT_LINK, SHARE_INVITE, SHARE_TIP, grantBadge } from "@/lib/community";

export function ShareDish({ showInvite = true }: { showInvite?: boolean }) {
  const [opened, setOpened] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(CAPTION); toast.success("Legenda copiada! É só colar no Instagram 💛"); }
    catch { toast.error("Não consegui copiar. Segure o dedo sobre a legenda para copiar."); }
  };
  return (
    <div className="my-3 rounded-[1.5rem] border-2 border-accent bg-primary p-5 text-primary-foreground shadow-soft">
      {showInvite && <p className="text-lg font-bold">{SHARE_INVITE}</p>}
      <p className="mt-2 text-base opacity-90">{SHARE_TIP}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a href={DIRECT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => { grantBadge(); setOpened(true); }}
          className="rounded-full bg-secondary px-5 py-3 text-center text-lg font-bold text-secondary-foreground">
          ENVIAR FOTO DO PRATO 📸
        </a>
        <button type="button" onClick={copy} className="rounded-full bg-accent px-5 py-3 text-lg font-bold text-accent-foreground">
          COPIAR LEGENDA
        </button>
      </div>
      <p className="mt-3 rounded-xl bg-primary-foreground/10 p-3 text-sm italic">{CAPTION}</p>
      {opened && <p className="mt-2 font-semibold">Abrimos o Direct da ZELFA! Você ganhou o selo ⭐ Chef da Comunidade 💛</p>}
    </div>
  );
}
