import { describe, expect, it } from "vitest";
import { essentialSpeech, MAX_SPOKEN_CHARS } from "@/lib/voice-rules";

const recipe = `Que delícia! Fiz um bolo de cenoura para você.
## Ingredientes
- 3 cenouras
- 2 xícaras de farinha
## Modo de preparo
1. Bata as cenouras.
2. Asse por 40 minutos.
## Lista de compras
- Farinha R$ 6,00
## Cardápio da semana
Segunda: sopa`;

describe("limites da voz", () => {
  it("fala a apresentação e o modo de preparo", () => {
    const s = essentialSpeech(recipe);
    expect(s).toContain("Que delícia");
    expect(s).toContain("Asse por 40 minutos");
  });
  it("não narra ingredientes, lista de compras nem cardápio", () => {
    const s = essentialSpeech(recipe);
    expect(s).not.toContain("3 cenouras");
    expect(s).not.toContain("R$ 6,00");
    expect(s).not.toContain("Segunda");
  });
  it("corta textos longos", () => {
    const long = "## Modo de preparo\n" + "Mexa bem a massa. ".repeat(200);
    expect(essentialSpeech(long).length).toBeLessThanOrEqual(MAX_SPOKEN_CHARS + 1);
  });
});
