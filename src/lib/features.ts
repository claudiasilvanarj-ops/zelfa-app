import type { Mode } from "./zelfa-prompts";

export type Feature = {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  tile: string;
  to: "/conversa" | "/sono" | "/respiracao" | "/musica" | "/jogos" | "/agenda";
  mode?: Mode;
  starter?: string;
};

export const FEATURES: Feature[] = [
  { key: "comida", emoji: "🍳", title: "Comida", desc: "Chef da ZELFA", tile: "bg-tile-1", to: "/conversa", mode: "comida", starter: "Oi, Chef da ZELFA! Quero ideias com o que tenho em casa. Posso escrever ou falar os ingredientes?" },
];

export const MODE_TITLES: Record<Mode, string> = {
  geral: "Conversa com a ZELFA",
  comida: "🍳 Chef da ZELFA",
  exercicio: "💪 Exercício",
  conversa: "💕 Conversa amorosa",
  noticias: "📰 Notícias",
  camera: "📷 O que a ZELFA vê",
  jogos: "🎮 Jogos & Diversão",
  ensina: "📱 Me Ensina",
  canto: "🎤 ZELFA canta",
};

export const MODE_HINTS: Partial<Record<Mode, string>> = {
  comida: "Pode escrever ou falar no microfone 🎤 o que você tem em casa.",
  ensina: "Tire uma foto do aparelho, do bilhete ou da caixa do remédio.",
  exercicio: "Mostre um objeto (elástico, cadeira, garrafa) ou peça um treino.",
};
