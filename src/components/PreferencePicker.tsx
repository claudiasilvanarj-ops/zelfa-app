import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PREFERENCES } from "@/lib/diet";

/** Escolha da preferência alimentar (primeira entrada e "Meu Perfil"). */
export function PreferencePicker({ current, notes: initialNotes, onSaved }: { current: string | null; notes: string | null; onSaved?: () => void }) {
  const [sel, setSel] = useState<string | null>(current);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [busy, setBusy] = useState(false);

  async function save(key: string) {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: row } = await supabase.from("dietary_restrictions").select("restrictions").maybeSingle();
    const prev = (row?.restrictions ?? []) as string[];
    const cleaned = key === "tudo" ? prev.filter((r) => !["vegano", "vegetariano", "pescetariano"].includes(r)) : prev;
    const { error } = await supabase.from("dietary_restrictions").upsert({
      user_id: u.user!.id,
      restrictions: cleaned,
      preference: key,
      notes: key === "escrever" ? notes.trim() || null : key === "tudo" ? null : notes.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { toast.error("Não consegui salvar agora."); return; }
    setSel(key);
    toast.success("Pronto! Todas as receitas vão seguir essa preferência 💛🍳");
    onSaved?.();
  }

  return (
    <div className="flex flex-col gap-3">
      {PREFERENCES.map((p) => (
        <button key={p.key} type="button" disabled={busy} aria-pressed={sel === p.key}
          onClick={() => (p.key === "escrever" ? setSel("escrever") : void save(p.key))}
          className={`flex min-h-14 items-center gap-3 rounded-3xl border-2 px-4 py-3 text-left text-lg font-semibold ${sel === p.key ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>
          <span className="text-3xl">{p.emoji}</span>{p.label}
        </button>
      ))}
      {sel === "escrever" && (
        <div className="flex flex-col gap-2">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} aria-label="Minhas restrições"
            placeholder="Ex.: alergia a camarão, sem glúten, sem lactose..." className="min-h-24 text-lg" />
          <Button size="lg" className="h-14 rounded-full text-lg" disabled={busy || !notes.trim()} onClick={() => void save("escrever")}>Salvar minhas restrições</Button>
        </div>
      )}
    </div>
  );
}
