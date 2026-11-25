import { describe, expect, it } from "vitest";
import { categoryAnswer } from "@/lib/recipes";
import { splitRecipes } from "@/lib/recipe-cards";

describe("cards de receita", () => {
  it("cada receita vira um card com nome, tempo, nível e categoria", () => {
    const pieces = splitRecipes(categoryAnswer("doces", [], "quero sobremesas", ""));
    const cards = pieces.flatMap((p) => (p.kind === "recipe" ? [p.recipe] : []));
    expect(cards.length).toBe(3);
    expect(cards.every((c) => c.category === "doces" && c.minutes && c.level)).toBe(true);
  });
  it("texto sem receita continua como texto", () => {
    expect(splitRecipes("Você quer algo salgado, doce, vegano ou saudável?")).toEqual([{ kind: "text", markdown: "Você quer algo salgado, doce, vegano ou saudável?" }]);
  });
});
