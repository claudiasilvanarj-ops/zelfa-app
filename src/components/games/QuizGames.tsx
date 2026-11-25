import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ENCOURAGEMENT, PRAISE, QUESTIONS } from "@/lib/games";
import { speak } from "@/lib/voice";
type Props = { onMessage: (message: string) => void };
export function QuizGame({ onMessage }: Props) {
  const [category, setCategory] = useState<keyof typeof QUESTIONS>("culinaria");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const questions = QUESTIONS[category]; const current = questions[index];
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Assunto do quiz">{([ ["culinaria", "Culinária"], ["curiosidades", "Curiosidades"], ["historia", "História do Brasil"] ] as const).map(([key, label]) => <Button key={key} aria-pressed={key === category} className="h-auto min-h-12 whitespace-normal text-lg" variant={key === category ? "default" : "outline"} onClick={() => { setCategory(key); setIndex(0); setScore(0); setSelected(null); }}>{label}</Button>)}</div>
    <p className="text-lg" aria-live="polite">{score} acertos · {Math.min(index + 1, questions.length)} de {questions.length} perguntas</p>
    {current ? <>
      <h3 className="text-2xl">{current.question}</h3>
      <div className="grid gap-3">{current.options.map((option) => <Button key={option} disabled={selected !== null} variant={selected === option ? "default" : "outline"} className="h-auto min-h-14 whitespace-normal px-4 py-3 text-xl" onClick={() => { setSelected(option); const correct = option === current.answer; if (correct) setScore(score + 1); onMessage(correct ? PRAISE : `${ENCOURAGEMENT} A resposta é ${current.answer}.`); }}>{option}</Button>)}</div>
      {selected && <Button className="h-12 text-lg" onClick={() => { setIndex(index + 1); setSelected(null); }}>{index === questions.length - 1 ? "Ver resultado" : "Próxima pergunta"}</Button>}
    </> : <><p className="text-2xl">Você acertou {score} de {questions.length}! Obrigada por brincar comigo. 💛</p><Button className="h-12 text-lg" onClick={() => { setIndex(0); setScore(0); setSelected(null); }}>Jogar de novo</Button></>}
  </div>;
}
const ANIMALS = [
  { sound: "Miau, miau!", answer: "Gato", options: ["Gato", "Cachorro", "Vaca"], emoji: "🐱" },
  { sound: "Au, au!", answer: "Cachorro", options: ["Pato", "Cachorro", "Gato"], emoji: "🐶" },
  { sound: "Muuu!", answer: "Vaca", options: ["Vaca", "Galo", "Ovelha"], emoji: "🐮" },
  { sound: "Có, có, ri, có!", answer: "Galo", options: ["Porco", "Pato", "Galo"], emoji: "🐓" },
  { sound: "Mééé!", answer: "Ovelha", options: ["Gato", "Ovelha", "Cavalo"], emoji: "🐑" },
];
export function AnimalSounds({ onMessage }: Props) {
  const [index, setIndex] = useState(0); const [solved, setSolved] = useState(false);
  const animal = ANIMALS[index % ANIMALS.length];
  if (!animal) return null;
  return <div className="space-y-5 text-center">
    <div className="text-7xl" aria-hidden="true">{solved ? animal.emoji : "🐾"}</div>
    <p className="text-3xl font-display">{animal.sound}</p>
    <Button variant="outline" className="h-14 text-xl" onClick={() => speak(animal.sound, { pitch: 1.3 })}>🔊 Ouvir o som</Button>
    <h3 className="text-2xl">Quem faz esse som?</h3>
    <div className="grid gap-3 sm:grid-cols-3">{animal.options.map((option) => <Button key={option} variant="outline" disabled={solved} className="h-14 text-xl" onClick={() => { const correct = option === animal.answer; setSolved(correct); onMessage(correct ? PRAISE : ENCOURAGEMENT); }}>{option}</Button>)}</div>
    {solved && <Button className="h-12 text-lg" onClick={() => { setIndex(index + 1); setSolved(false); }}>Próximo animal</Button>}
  </div>;
}