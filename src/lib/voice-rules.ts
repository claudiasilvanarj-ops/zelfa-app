/** Limites da voz da ZELFA (mesmo padrão do Reforço Escolar: só o essencial, sob demanda, uma fala por vez). */

export const GREETING = "Olá! Que bom te ver! 💛 Vamos cozinhar hoje?";
export const MAX_SPOKEN_CHARS = 900;

export const SPEEDS = { lenta: 0.85, normal: 1, rapida: 1.2 } as const;
export type Speed = keyof typeof SPEEDS;
export type VoiceSettings = { enabled: boolean; speed: Speed };
export const DEFAULT_SETTINGS: VoiceSettings = { enabled: true, speed: "normal" };

const SKIP = /(lista de compras|compras|cardápio|cardapio|custo|preço|preco|ingredientes|substitui|dica)/i;
const KEEP = /(modo de preparo|preparo|passo a passo|como fazer)/i;

/**
 * Reduz uma resposta ao essencial para falar: apresentação curta + modo de preparo.
 * Nunca narra listas de compras, cardápios inteiros nem ingredientes.
 */
export function essentialSpeech(markdown: string): string {
  const lines = markdown.split("\n");
  const intro: string[] = [];
  const steps: string[] = [];
  let section: "intro" | "keep" | "skip" = "intro";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const isHeading = /^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*:?$/.test(line);
    if (isHeading) {
      section = KEEP.test(line) ? "keep" : SKIP.test(line) ? "skip" : section === "intro" ? "intro" : "skip";
      if (section === "keep") steps.push(line);
      continue;
    }
    if (section === "keep") steps.push(line);
    else if (section === "intro" && !/^[-*•]|\d+[.)]/.test(line) && intro.length < 1) intro.push(line);
  }
  let out = [...intro, ...steps].join("\n");
  if (!out) out = lines.find((l) => l.trim())?.trim() ?? "";
  if (out.length > MAX_SPOKEN_CHARS) {
    const cut = out.slice(0, MAX_SPOKEN_CHARS);
    out = cut.slice(0, Math.max(cut.lastIndexOf("."), cut.lastIndexOf("\n"), 200)) + ".";
  }
  return out;
}
