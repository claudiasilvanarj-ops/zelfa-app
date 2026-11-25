import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRAISE } from "@/lib/games";

const COLORS = [
  { name: "Coral", token: "var(--primary)", className: "bg-primary" },
  { name: "Dourado", token: "var(--gold)", className: "bg-gold" },
  { name: "Verde", token: "var(--game-green)", className: "bg-game-green" },
  { name: "Azul", token: "var(--game-blue)", className: "bg-game-blue" },
  { name: "Rosa", token: "var(--game-pink)", className: "bg-game-pink" },
];
export function ColoringGame({ onMessage }: { onMessage: (text: string) => void }) {
  const [color, setColor] = useState("var(--primary)");
  const [fills, setFills] = useState<Record<string, string>>({});
  function paint(id: string) { setFills({ ...fills, [id]: color }); onMessage(`${PRAISE} Seu jardim está ficando lindo!`); }
  const shapeProps = (id: string, label: string) => ({
    role: "button", tabIndex: 0, "aria-label": `Colorir ${label}`, fill: fills[id] ?? "var(--card)",
    onClick: () => paint(id), onKeyDown: (event: React.KeyboardEvent<SVGElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); paint(id); } },
  });
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Cores">{COLORS.map((item) => <Button key={item.name} variant="outline" aria-label={item.name} aria-pressed={color === item.token} title={item.name} className={`h-12 w-12 rounded-full border-4 p-0 ${item.className} ${color === item.token ? "border-foreground" : "border-card"}`} onClick={() => setColor(item.token)} />)}</div>
    <svg id="zelfa-coloring" viewBox="0 0 500 400" className="mx-auto w-full max-w-xl rounded-2xl bg-card" aria-label="Jardim para colorir" stroke="var(--foreground)" strokeWidth="3">
      <circle {...shapeProps("sun", "sol")} cx="415" cy="65" r="35" />
      <path {...shapeProps("hill", "grama")} d="M0 340 Q120 285 250 330 Q390 270 500 325 V400 H0 Z" />
      {[130, 270].map((x, index) => <g key={x}>
        <path d={`M${x} 320 V180`} stroke="var(--game-green)" strokeWidth="8" />
        <ellipse {...shapeProps(`leaf-${index}`, `folha ${index + 1}`)} cx={x + 25} cy="260" rx="30" ry="13" transform={`rotate(-30 ${x + 25} 260)`} />
        {[0, 60, 120, 180, 240, 300].map((angle, petal) => <ellipse key={angle} {...shapeProps(`petal-${index}-${petal}`, `pétala ${petal + 1} da flor ${index + 1}`)} cx={x} cy="135" rx="20" ry="38" transform={`rotate(${angle} ${x} 180)`} />)}
        <circle {...shapeProps(`center-${index}`, `miolo da flor ${index + 1}`)} cx={x} cy="180" r="22" />
      </g>)}
      <path {...shapeProps("cloud", "nuvem")} d="M45 65 C25 40 55 20 75 40 C90 10 135 20 135 48 C165 40 180 75 150 80 H55 C40 80 35 70 45 65 Z" />
    </svg>
    <div className="flex flex-wrap gap-3"><Button variant="outline" className="h-12 text-lg" onClick={() => setFills({})}><RotateCcw /> Recomeçar</Button><Button variant="outline" className="h-12 text-lg" onClick={() => {
      const element = document.getElementById("zelfa-coloring"); if (!element) return;
      const clone = element.cloneNode(true) as SVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const styles = getComputedStyle(document.documentElement);
      for (const node of [clone, ...Array.from(clone.querySelectorAll("*"))]) {
        for (const attribute of ["fill", "stroke"]) {
          const value = node.getAttribute(attribute); const match = value?.match(/^var\((--[^)]+)\)$/);
          if (match?.[1]) node.setAttribute(attribute, styles.getPropertyValue(match[1]).trim());
        }
      }
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
      const link = document.createElement("a"); link.href = url; link.download = "meu-jardim-zelfa.svg"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}><Download /> Guardar desenho</Button></div>
  </div>;
}
const CHAPTERS = [
  { intro: "Num jardim encantado, uma menina encontrou uma porta pequenina. Quem estava do outro lado?", choices: ["Um coelho de chapéu", "Uma fada jardineira", "Um gatinho falante"] },
  { intro: "O novo amigo sorriu e mostrou um caminho brilhante. Para onde eles foram?", choices: ["Uma floresta de doces", "Uma praia de conchas", "Um castelo nas nuvens"] },
  { intro: "No caminho, encontraram uma surpresa. O que era?", choices: ["Uma semente que cantava", "Um mapa de estrelas", "Uma flor que dançava"] },
  { intro: "Para ajudar um passarinho perdido, decidiram…", choices: ["Cantar uma canção", "Construir uma casinha", "Chamar todos os amigos"] },
];
export function StoryGame({ onMessage }: { onMessage: (text: string) => void }) {
  const [parts, setParts] = useState<string[]>([]); const [custom, setCustom] = useState("");
  const chapter = CHAPTERS[parts.length];
  function add(value: string) { setParts([...parts, value]); setCustom(""); onMessage(`${PRAISE} Que imaginação bonita!`); }
  return <div className="space-y-5">
    <div className="text-center text-6xl" aria-hidden="true">📖 🐰 🌷</div>
    {parts.map((part, index) => <p className="text-xl" key={index}>{CHAPTERS[index]?.intro} <b>{part}.</b></p>)}
    {chapter ? <><h3 className="text-2xl">{chapter.intro}</h3><div className="grid gap-3">{chapter.choices.map((choice) => <Button variant="outline" key={choice} className="h-auto min-h-14 whitespace-normal p-3 text-xl" onClick={() => add(choice)}>{choice}</Button>)}</div>
      <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); if (custom.trim()) add(custom.trim()); }}><input aria-label="Sua ideia para a história" placeholder="Minha ideia…" maxLength={180} className="min-w-0 flex-1 rounded-xl border-2 bg-card p-3 text-lg" value={custom} onChange={(event) => setCustom(event.target.value)} /><Button disabled={!custom.trim()} className="h-14 text-lg">Acrescentar</Button></form></>
      : <p className="text-2xl">E assim, com amizade e carinho, todos voltaram ao jardim para celebrar. Fim! 💛</p>}
    <Button variant="outline" className="h-12 text-lg" onClick={() => { setParts([]); setCustom(""); }}>Nova história</Button>
  </div>;
}