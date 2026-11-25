import { describe, expect, it } from "vitest";
import { dietPrompt, effectiveRestrictions, guardRecipes, isAllowed, recipeTypeBadge } from "@/lib/diet";

describe("preferência alimentar", () => {
  it("vegetariano nunca aceita frango, carne ou peixe", () => {
    expect(isAllowed(["peito de frango"], ["vegetariano"])).toBe(false);
    expect(isAllowed(["filé de tilápia"], ["vegetariano"])).toBe(false);
    expect(isAllowed(["grão-de-bico", "ovos", "queijo"], ["vegetariano"])).toBe(true);
  });
  it("pescetariano aceita peixe e recusa carne", () => {
    expect(isAllowed(["salmão", "camarão"], ["pescetariano"])).toBe(true);
    expect(isAllowed(["carne moída"], ["pescetariano"])).toBe(false);
  });
  it("vegano recusa ovo e leite", () => {
    expect(isAllowed(["ovos"], ["vegano"])).toBe(false);
    expect(isAllowed(["leite"], ["vegano"])).toBe(false);
  });
  it("junta perfil e filtro rápido", () => {
    expect(effectiveRestrictions(["gluten"], "vegetariano", "todas").sort()).toEqual(["gluten", "vegetariano"]);
    expect(effectiveRestrictions([], "tudo", "vegano")).toEqual(["vegano"]);
    expect(effectiveRestrictions([], "pescetariano", "vegetariano")).toEqual(["vegetariano"]);
  });
  it("selo do tipo de receita", () => {
    expect(recipeTypeBadge(["tofu", "arroz"])).toBe("🌱 Vegana");
    expect(recipeTypeBadge(["ovos", "queijo"])).toBe("🥗 Vegetariana");
    expect(recipeTypeBadge(["tilápia"])).toBe("🐟 Pescetariana");
    expect(recipeTypeBadge(["frango"])).toBe("🍗 Tradicional");
  });
  it("bloqueia receita de frango para vegetariano e pede adaptação", () => {
    const md = "### Frango assado\n\nIngredientes:\n- 1 frango\n\nModo de preparo:\n1. Asse";
    expect(guardRecipes(md, ["vegetariano"]).blocked).toBe(1);
    expect(dietPrompt(["vegetariano"])).toContain("Como você é vegetariano(a)");
    expect(dietPrompt([], "sem glúten")).toContain("sem glúten");
  });
});
