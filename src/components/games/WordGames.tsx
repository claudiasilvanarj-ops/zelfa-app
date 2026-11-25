import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CROSSWORDS, ENCOURAGEMENT, PRAISE, WORDS, crosswordCells, isAnswer, normalizeAnswer } from "@/lib/games";

type Props = { onMessage: (message: string) => void };
export function Hangman({ onMessage }: Props) {
  const [round, setRound] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const current = WORDS[round % WORDS.length];
  if (!current) return null;
  const wrong = letters.filter((letter) => !current.word.includes(letter)).length;
  const won = [...current.word].every((letter) => letters.includes(letter));
  const done = won || wrong >= 6;
  return <div className="space-y-5">
    <p className="text-xl">{current.clue}</p>
    <p className="text-lg">{6 - wrong} tentativas restantes</p>
    <div className="flex flex-wrap justify-center gap-2" aria-label="Palavra da forca">{[...current.word].map((letter, i) => <span key={i} className="flex h-12 w-9 items-center justify-center border-b-4 border-primary font-display text-2xl">{letters.includes(letter) || done ? letter : "_"}</span>)}</div>
    <div className="mx-auto grid max-w-xl grid-cols-6 gap-2 sm:grid-cols-9">{[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => <Button className="h-12 p-0 text-xl" variant="outline" key={letter} disabled={done || letters.includes(letter)} onClick={() => {
      const next = [...letters, letter]; setLetters(next);
      const win = [...current.word].every((char) => next.includes(char));
      const lost = next.filter((char) => !current.word.includes(char)).length >= 6;
      onMessage(win ? `${PRAISE} A palavra é ${current.word.toLowerCase()}.` : lost ? `A palavra era ${current.word.toLowerCase()}. Sem pressa, vamos brincar de novo!` : current.word.includes(letter) ? PRAISE : ENCOURAGEMENT);
    }}>{letter}</Button>)}</div>
    {done && <p role="status" className="text-xl font-bold">{won ? "Você descobriu!" : `A palavra era ${current.word}.`}</p>}
    <Button variant="outline" className="h-12 text-lg" onClick={() => { setRound(round + 1); setLetters([]); onMessage("Uma nova palavra! Vamos lá!"); }}>Outra palavra</Button>
  </div>;
}
export function Riddles({ onMessage }: Props) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState(false);
  const current = WORDS[round % WORDS.length];
  if (!current) return null;
  return <div className="space-y-5">
    <p className="text-2xl">Estou pensando em… {current.clue.toLowerCase()}. O que é?</p>
    <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); const correct = isAnswer(answer, current.word); setSolved(correct); onMessage(correct ? PRAISE : ENCOURAGEMENT); }}>
      <input aria-label="Sua resposta" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={solved} className="min-w-0 flex-1 rounded-xl border-2 bg-card px-4 py-3 text-xl" autoComplete="off" />
      <Button disabled={solved || !answer.trim()} className="h-14 text-lg">Responder</Button>
    </form>
    <Button variant="outline" className="h-12 text-lg" onClick={() => onMessage(`Uma dica: começa com ${current.word[0]} e tem ${current.word.length} letras.`)}>Uma dica</Button>
    {solved && <Button className="ml-2 h-12 text-lg" onClick={() => { setRound(round + 1); setAnswer(""); setSolved(false); onMessage("Vamos para a próxima adivinhação!"); }}>Próxima</Button>}
  </div>;
}
export function Crosswords({ onMessage }: Props) {
  const cells = crosswordCells();
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  return <div className="space-y-5">
    <div className="mx-auto grid w-full max-w-sm grid-cols-5 gap-1.5">
      {Array.from({ length: 25 }, (_, i) => {
        const row = Math.floor(i / 5); const col = i % 5; const key = `${row}-${col}`;
        const letter = cells[key];
        const number = CROSSWORDS.findIndex((word) => word.row === row && word.col === col);
        if (!letter) return <div key={key} className="aspect-square" />;
        return <label key={key} className="relative aspect-square">
          {number >= 0 && <span className="absolute left-1 top-0.5 text-xs">{number + 1}</span>}
          <input aria-label={`Linha ${row + 1}, coluna ${col + 1}`} maxLength={1} value={values[key] ?? ""} disabled={solved} onChange={(event) => { setValues({ ...values, [key]: normalizeAnswer(event.target.value).slice(-1) }); setChecked(false); }} className={`h-full w-full rounded-md border-2 bg-card text-center font-display text-2xl uppercase ${checked && values[key] !== letter ? "border-destructive" : "border-input"}`} autoComplete="off" />
        </label>;
      })}
    </div>
    <ul className="space-y-2 text-lg">{CROSSWORDS.map((word) => <li key={word.answer}>{word.clue}</li>)}</ul>
    <div className="flex flex-wrap gap-3"><Button disabled={solved} className="h-12 text-lg" onClick={() => { const correct = Object.entries(cells).every(([key, letter]) => values[key] === letter); setChecked(true); setSolved(correct); onMessage(correct ? `${PRAISE} Todas as palavras estão certas!` : ENCOURAGEMENT); }}>Conferir</Button>
      <Button variant="outline" className="h-12 text-lg" onClick={() => { setValues({}); setChecked(false); setSolved(false); }}>Recomeçar</Button></div>
  </div>;
}