import { useEffect, useRef, useState } from "react";
import { RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ENCOURAGEMENT, PRAISE, memoryMatch, shuffle } from "@/lib/games";
import { fileToDataUrl } from "@/lib/voice";

type Card = { id: string; pair: string; image?: string; label: string };
const THEMES = { frutas: ["🍓", "🍌", "🍇", "🍊", "🍉", "🍎"], animais: ["🐶", "🐱", "🐮", "🐸", "🐰", "🦋"] };
export function MemoryGame({ gentle = false, onMessage }: { gentle?: boolean; onMessage: (text: string) => void }) {
  const [theme, setTheme] = useState<"frutas" | "animais" | "familia">("frutas");
  const [photos, setPhotos] = useState<string[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function reset(selected = theme, images = photos) {
    if (timer.current) clearTimeout(timer.current);
    const source: Omit<Card, "id">[] = selected === "familia"
      ? images.map((image, i) => ({ pair: String(i), image, label: `Foto ${i + 1}` }))
      : THEMES[selected].slice(0, gentle ? 3 : 6).map((label) => ({ pair: label, label }));
    setCards(shuffle(source.flatMap((card, i) => [ { ...card, id: `${i}-a` }, { ...card, id: `${i}-b` } ])));
    setOpen([]); setMatched([]); setMoves(0);
  }
  useEffect(() => { reset(); return () => { if (timer.current) clearTimeout(timer.current); }; }, []);
  function flip(card: Card) {
    if (open.length === 2 || open.includes(card.id) || matched.includes(card.pair)) return;
    const next = [...open, card.id]; setOpen(next);
    if (next.length !== 2) return;
    setMoves((value) => value + 1);
    const first = cards.find((item) => item.id === next[0]);
    if (!first) return;
    if (memoryMatch(first, card)) {
      const pairs = [...matched, card.pair]; setMatched(pairs); setOpen([]);
      onMessage(pairs.length * 2 === cards.length ? `${PRAISE} Você encontrou todos os pares!` : PRAISE);
    } else {
      onMessage(ENCOURAGEMENT);
      timer.current = setTimeout(() => setOpen([]), gentle ? 2200 : 1300);
    }
  }
  return <div className="space-y-5">
    {!gentle && <div className="flex flex-wrap gap-2" role="group" aria-label="Tema das cartas">
      {([ ["frutas", "Frutas"], ["animais", "Animais"], ["familia", "Família"] ] as const).map(([key, label]) => <Button key={key} variant={theme === key ? "default" : "outline"} className="h-12 text-lg" aria-pressed={theme === key} onClick={() => { setTheme(key); reset(key); }}>{label}</Button>)}
    </div>}
    {theme === "familia" && <div className="space-y-3">
      <p className="text-muted-foreground">As fotos ficam só nesta brincadeira e saem ao fechar a tela.</p>
      <Button asChild variant="outline" className="h-auto min-h-12 whitespace-normal text-lg"><label><Upload /> Escolher de 2 a 6 fotos<input type="file" accept="image/*" multiple hidden onChange={async (event) => {
        const files = Array.from(event.target.files ?? []).slice(0, 6);
        if (files.length < 2) { setUploadError("Escolha pelo menos duas fotos."); return; }
        try { const images = await Promise.all(files.map((file) => fileToDataUrl(file))); setPhotos(images); reset("familia", images); setUploadError(""); }
        catch { setUploadError("Não consegui abrir essas fotos. Vamos escolher outras?"); }
      }} /></label></Button>
      {uploadError && <p role="alert">{uploadError}</p>}
    </div>}
    {cards.length > 0 && <>
      <p className="text-lg" aria-live="polite">{matched.length} de {cards.length / 2} pares · {moves} tentativas</p>
      <div className={`mx-auto grid max-w-xl gap-3 ${gentle ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"}`}>
        {cards.map((card, index) => {
          const visible = open.includes(card.id) || matched.includes(card.pair);
          return <Button key={card.id} aria-label={`Carta ${index + 1}${visible ? `: ${card.label}` : ": virada"}`} aria-pressed={visible} disabled={matched.includes(card.pair)} onClick={() => flip(card)} variant="outline" className={`h-auto aspect-square min-w-0 overflow-hidden rounded-2xl p-2 text-4xl sm:text-5xl ${visible ? "bg-card" : "bg-tile-4"}`}>
            {visible ? card.image ? <img src={card.image} alt={card.label} className="h-full w-full rounded-xl object-cover" /> : card.label : "🌸"}
          </Button>;
        })}
      </div>
      <Button onClick={() => reset()} variant="outline" className="h-12 text-lg"><RotateCcw /> Jogar de novo</Button>
    </>}
  </div>;
}