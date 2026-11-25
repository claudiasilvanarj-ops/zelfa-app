import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MemoryGame } from "@/components/games/MemoryGame";
import { Crosswords, Hangman, Riddles } from "@/components/games/WordGames";
import { AnimalSounds, QuizGame } from "@/components/games/QuizGames";
import { ColoringGame, StoryGame } from "@/components/games/CreativeGames";
import { GAMES, type GameId } from "@/lib/games";
import { speak, stopSpeaking } from "@/lib/voice";
import avatar from "@/assets/zelfa-avatar.png";

export const Route = createFileRoute("/_authenticated/jogos")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Jogos & Diversão — ZELFA | eXPLIK@ das Galáxias" },
    { name: "description", content: "Brinque com a ZELFA: memória, forca, palavras cruzadas, quiz, adivinhações, colorir e histórias para toda a família." },
    { property: "og:title", content: "Jogos & Diversão — ZELFA | eXPLIK@ das Galáxias" },
    { property: "og:description", content: "Jogos tranquilos e divertidos com a companhia carinhosa da ZELFA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GamesPage,
});
function GamesPage() {
  const [active, setActive] = useState<GameId | null>(null);
  const [voice, setVoice] = useState(false);
  const [message, setMessage] = useState("Vamos brincar? Escolha sua brincadeira. 💛");
  useEffect(() => () => stopSpeaking(), []);
  function say(text: string) { setMessage(text); if (voice) speak(text); }
  const game = GAMES.find((item) => item.id === active);
  return <AppShell title="Jogos & Diversão" wide>
    <section className="mb-6 flex items-center gap-3 border-b pb-5 sm:gap-5">
      <img src={avatar} alt="ZELFA" className="h-16 w-16 shrink-0 sm:h-24 sm:w-24" />
      <p role="status" aria-live="polite" className="min-w-0 flex-1 text-lg sm:text-2xl">{message}</p>
      <Button size="icon" variant="outline" className="h-12 w-12 shrink-0 rounded-full" aria-label={voice ? "Desligar voz da ZELFA" : "Ouvir ZELFA"} aria-pressed={voice} title={voice ? "Desligar voz da ZELFA" : "Ouvir ZELFA"} onClick={() => { setVoice(!voice); if (!voice) speak(message); else stopSpeaking(); }}>{voice ? <Volume2 /> : <VolumeX />}</Button>
    </section>
    {!game ? <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {GAMES.map((item) => <Button key={item.id} variant="ghost" className={`${item.tile} h-auto min-h-44 min-w-0 flex-col items-start justify-between whitespace-normal rounded-[1.75rem] p-4 text-left shadow-soft sm:p-5`} onClick={() => { setActive(item.id); say("Sem pressa. Vamos lá! 💛"); }}>
        <span className="text-5xl" aria-hidden="true">{item.emoji}</span>
        <span><span className="block font-display text-xl font-semibold leading-tight">{item.title}</span><span className="mt-1 block text-sm text-foreground/75">{item.description}</span></span>
      </Button>)}
    </section> : <section className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center gap-3"><Button variant="outline" className="h-12 text-lg" onClick={() => { setActive(null); say("Qual brincadeira vamos escolher agora?"); }}><ArrowLeft /> Todos os jogos</Button><h2 className="text-2xl">{game.emoji} {game.title}</h2></div>
      {active === "memoria" && <MemoryGame onMessage={say} />}
      {active === "leve" && <MemoryGame gentle onMessage={say} />}
      {active === "forca" && <Hangman onMessage={say} />}
      {active === "cruzadas" && <Crosswords onMessage={say} />}
      {active === "adivinha" && <Riddles onMessage={say} />}
      {active === "quiz" && <QuizGame onMessage={say} />}
      {active === "sons" && <AnimalSounds onMessage={say} />}
      {active === "colorir" && <ColoringGame onMessage={say} />}
      {active === "historia" && <StoryGame onMessage={say} />}
    </section>}
    <Button asChild variant="link" className="mt-6 h-auto whitespace-normal text-lg"><Link to="/conversa" search={{ modo: "jogos" }}>💕 Conversar e brincar com a ZELFA</Link></Button>
  </AppShell>;
}