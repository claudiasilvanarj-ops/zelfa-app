import { describe, expect, it } from "vitest";
import { conflicts } from "@/lib/diet";
import { RECIPE_CATEGORIES, RECIPES, allowedRecipes, categoryAnswer, pickRecipes, requestedCount, suggestedNames } from "@/lib/recipes";

const MEAT = ["carne", "frango", "bacon", "linguiça", "sardinha", "atum", "peixe", "camarão", "bacalhau", "lombo", "presunto", "salame", "filé"];

describe("banco de receitas", () => {
  it("tem pelo menos 10 receitas próprias em cada categoria", () => {
    for (const c of RECIPE_CATEGORIES) expect(RECIPES.filter((r) => r.category === c).length).toBeGreaterThanOrEqual(10);
  });
  it("doces nunca têm carne", () => {
    for (const r of RECIPES.filter((x) => x.category === "doces")) {
      const all = [r.name, ...r.ingredients].join(" ").toLowerCase();
      expect(MEAT.some((m) => all.includes(m))).toBe(false);
    }
  });
  it("vegano e sem glúten passam no próprio filtro", () => {
    for (const r of RECIPES.filter((x) => x.category === "vegano")) expect(conflicts([r.name, ...r.ingredients], ["vegano"])).toEqual([]);
    for (const r of RECIPES.filter((x) => x.category === "sem_gluten")) expect(conflicts([r.name, ...r.ingredients], ["gluten"])).toEqual([]);
  });
  it("vegano com carne moída avisa e não traz carne", () => {
    const a = categoryAnswer("vegano", [], "tenho carne moída, cenoura e batata", "");
    expect(a).toContain("Atenção");
    expect(a).toContain("✅ Vegano");
    expect(suggestedNames(a).every((n) => RECIPES.find((r) => r.name === n)?.category === "vegano")).toBe(true);
  });
  it("pedido repetido traz receitas diferentes", () => {
    const first = categoryAnswer("doces", [], "quero sobremesas", "");
    const second = categoryAnswer("doces", [], "quero sobremesas", first);
    const a = suggestedNames(first), b = suggestedNames(second);
    expect(a.length).toBe(3);
    expect(b.some((n) => a.includes(n))).toBe(false);
  });
  it("entrega a quantidade pedida, nunca menos de 3", () => {
    expect(requestedCount("me dê 3 pratos")).toBe(3);
    expect(requestedCount("quero cinco receitas")).toBe(5);
    expect(requestedCount("algo")).toBe(3);
    expect(pickRecipes("visitas", [], { count: 5 }).length).toBe(5);
  });
  it("restrição do perfil também filtra a categoria", () => {
    expect(allowedRecipes("doces", ["lactose"]).every((r) => conflicts(r.ingredients, ["lactose"]).length === 0)).toBe(true);
  });
});

import { bankCovers, DYNAMIC_RECIPE_RULES } from "@/lib/recipes";
describe("receitas criadas na hora", () => {
  it("quando o banco não tem receitas novas suficientes, a ZELFA cria na hora", () => {
    expect(bankCovers("dia_a_dia", ["vegano"], "quero receitas", "")).toBe(false);
    const all = RECIPES.filter((r) => r.category === "doces").map((r) => `### ${r.name}`).join("\n");
    expect(bankCovers("doces", [], "quero doces", all)).toBe(false);
    expect(bankCovers("doces", [], "quero doces", "")).toBe(true);
  });
  it("proíbe dizer que não tem a receita e exige variar", () => {
    expect(DYNAMIC_RECIPE_RULES).toContain('NUNCA diga "não tenho essa receita"');
    expect(DYNAMIC_RECIPE_RULES).toContain("DIFERENTES das anteriores");
  });
});
