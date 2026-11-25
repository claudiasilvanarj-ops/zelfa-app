export const GAMES = [
  { id: "memoria", emoji: "🍓", title: "Jogo da memória", description: "Frutas, animais e sua família", tile: "bg-tile-1" },
  { id: "forca", emoji: "🔤", title: "Forca", description: "Uma letra de cada vez", tile: "bg-tile-2" },
  { id: "cruzadas", emoji: "✏️", title: "Palavras cruzadas", description: "Palavras que se encontram", tile: "bg-tile-4" },
  { id: "adivinha", emoji: "🍌", title: "Adivinhações", description: "O que estou pensando?", tile: "bg-tile-3" },
  { id: "quiz", emoji: "💡", title: "Quiz de conhecimentos", description: "Culinária, curiosidades e história", tile: "bg-tile-2" },
  { id: "leve", emoji: "🌼", title: "Memória tranquila", description: "Sem relógio, no seu ritmo", tile: "bg-tile-4" },
  { id: "colorir", emoji: "🎨", title: "Colorir", description: "Um jardim cheio de cores", tile: "bg-tile-5" },
  { id: "sons", emoji: "🐮", title: "Sons dos animais", description: "Quem faz esse som?", tile: "bg-tile-1" },
  { id: "historia", emoji: "📖", title: "Histórias em dupla", description: "Uma aventura a cada escolha", tile: "bg-tile-3" },
] as const;
export type GameId = (typeof GAMES)[number]["id"];
export const PRAISE = "Isso! Você é demais! 🎉";
export const ENCOURAGEMENT = "Quase! Vamos tentar de novo? 💛";
export function normalizeAnswer(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}
export function isAnswer(value: string, answer: string) { return normalizeAnswer(value) === normalizeAnswer(answer); }
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = result[i]; const right = result[j];
    if (left !== undefined && right !== undefined) { result[i] = right; result[j] = left; }
  }
  return result;
}
export function memoryMatch(a: { pair: string }, b: { pair: string }) { return a.pair === b.pair; }
export const WORDS = [
  { word: "BANANA", clue: "Uma fruta amarela" },
  { word: "GATO", clue: "Um animal que faz miau" },
  { word: "PANELA", clue: "Usamos para cozinhar" },
  { word: "JARDIM", clue: "Um lugar cheio de flores" },
  { word: "AMIZADE", clue: "Um carinho que une as pessoas" },
];
export const QUESTIONS = {
  culinaria: [
    { question: "Qual ingrediente faz o pão crescer?", options: ["Sal", "Fermento", "Água"], answer: "Fermento" },
    { question: "De que é feita a tapioca?", options: ["Mandioca", "Trigo", "Milho"], answer: "Mandioca" },
    { question: "Qual destes é um tempero?", options: ["Canela", "Arroz", "Feijão"], answer: "Canela" },
  ],
  curiosidades: [
    { question: "Quantas patas tem uma borboleta?", options: ["Quatro", "Seis", "Oito"], answer: "Seis" },
    { question: "Qual animal produz mel?", options: ["Formiga", "Abelha", "Borboleta"], answer: "Abelha" },
    { question: "Qual é o maior planeta do Sistema Solar?", options: ["Terra", "Marte", "Júpiter"], answer: "Júpiter" },
  ],
  historia: [
    { question: "Em que ano foi proclamada a Independência do Brasil?", options: ["1822", "1889", "1500"], answer: "1822" },
    { question: "Quem foi a primeira mulher eleita presidente do Brasil?", options: ["Anita Garibaldi", "Dilma Rousseff", "Princesa Isabel"], answer: "Dilma Rousseff" },
    { question: "Qual cidade foi a primeira capital do Brasil?", options: ["Brasília", "Salvador", "Rio de Janeiro"], answer: "Salvador" },
  ],
};
export const CROSSWORDS = [
  { answer: "GATO", row: 0, col: 0, direction: "across", clue: "1. Animal que faz miau (horizontal)" },
  { answer: "ARARA", row: 0, col: 1, direction: "down", clue: "2. Ave brasileira colorida (vertical)" },
  { answer: "SAPO", row: 2, col: 0, direction: "across", clue: "3. Animal que pula e faz coaxar (horizontal)" },
] as const;
export function crosswordCells() {
  const cells: Record<string, string> = {};
  for (const word of CROSSWORDS) {
    [...word.answer].forEach((letter, index) => {
      const row = word.row + (word.direction === "down" ? index : 0);
      const col = word.col + (word.direction === "across" ? index : 0);
      cells[`${row}-${col}`] = letter;
    });
  }
  return cells;
}