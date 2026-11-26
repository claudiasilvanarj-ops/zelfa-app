import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadDishPhoto } from "@/lib/dish-community";
import { PHOTO_ACCEPT, isAcceptedPhoto, preparePhoto } from "@/lib/photo-prep";

type Step = "closed" | "menu" | "preview" | "confirm";

export function DishPhotoButton({ title, category, markdown, onDone, label = "📸 FOTOGRAFEI MEU PRATO" }: { title: string; category: string; markdown?: string; onDone: () => void; label?: string }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("closed");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file); setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function close() { setStep("closed"); setFile(null); setConsent(false); }

  async function pick(f: File | undefined) {
    if (!f) return;
    if (!isAcceptedPhoto(f)) { toast.error("Escolha uma foto em JPG, PNG, WEBP ou HEIC 💛"); return; }
    setBusy(true);
    try { setFile(await preparePhoto(f)); setStep("preview"); }
    catch { toast.error("Não consegui abrir essa foto. Tente outra 💛"); }
    finally { setBusy(false); }
  }

  async function send() {
    if (!file) return;
    setBusy(true);
    try {
      await uploadDishPhoto(file, { title, category, markdown }, consent);
      toast.success(consent ? "Foto salva! A Sil vai olhar com carinho para o Instagram 💛" : "Foto salva no seu Álbum da Cozinha! 💛");
      close(); onDone();
    } catch {
      toast.error("Não consegui guardar a foto agora. Tente de novo.");
    } finally { setBusy(false); }
  }

  const big = "w-full rounded-2xl px-4 py-3 text-lg font-bold disabled:opacity-60";
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ""; void pick(f); };

  return (
    <>
      <button type="button" onClick={() => setStep("menu")} className="rounded-full border-2 border-gold px-4 py-2 font-bold">{label}</button>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden aria-label="Tirar foto do prato" onChange={onInput} />
      <input ref={gallery} type="file" accept={PHOTO_ACCEPT} hidden aria-label="Escolher foto da galeria" onChange={onInput} />
      <Dialog open={step !== "closed"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          {step === "menu" && (<>
            <DialogHeader><DialogTitle>Como quer mostrar seu prato? 🍳</DialogTitle></DialogHeader>
            <button type="button" disabled={busy} onClick={() => camera.current?.click()} className={`${big} bg-accent text-accent-foreground`}>📷 Tirar foto agora</button>
            <button type="button" disabled={busy} onClick={() => gallery.current?.click()} className={`${big} border-2 border-gold`}>{busy ? "Abrindo a foto…" : "🖼️ Escolher da galeria"}</button>
            <p className="text-sm text-muted-foreground">JPG, PNG, WEBP ou HEIC. Fotos grandes são ajustadas sozinhas 💛</p>
          </>)}
          {step === "preview" && (<>
            <DialogHeader><DialogTitle>Ficou assim 💛</DialogTitle></DialogHeader>
            {url && <img src={url} alt="Pré-visualização do prato" className="max-h-72 w-full rounded-2xl object-cover" />}
            <button type="button" onClick={() => setStep("confirm")} className={`${big} bg-accent text-accent-foreground`}>✅ USAR ESTA FOTO</button>
            <button type="button" onClick={() => { setFile(null); setStep("menu"); }} className={`${big} border-2 border-gold`}>🔄 TROCAR</button>
          </>)}
          {step === "confirm" && (<>
            <DialogHeader><DialogTitle>Que lindo! 💛</DialogTitle></DialogHeader>
            {url && <img src={url} alt="Seu prato" className="max-h-72 w-full rounded-2xl object-cover" />}
            <p className="text-lg"><b>{title}</b> vai para o seu Álbum da Cozinha.</p>
            <label className="flex items-start gap-3 rounded-2xl border-2 border-border p-3 text-lg">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-6 w-6" />
              <span>Quero aparecer na Comunidade ZELFA 💛<span className="block text-sm text-muted-foreground">Só com o seu primeiro nome. Sem marcar, a foto fica só para você.</span></span>
            </label>
            <button type="button" disabled={busy} onClick={send} className={`${big} bg-accent text-accent-foreground`}>
              {busy ? "Guardando…" : "SALVAR FOTO 📸"}
            </button>
          </>)}
        </DialogContent>
      </Dialog>
    </>
  );
}
