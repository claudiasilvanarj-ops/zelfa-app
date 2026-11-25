import { describe, expect, it } from "vitest";
import { dishKind } from "@/lib/dish-photos";
import { recipeParts, ingredientName } from "@/lib/recipe-cards";

describe("card de receita", () => {
  it("omelete mostra foto de ovos", () => expect(dishKind("Omelete de queijo")).toBe("ovos"));
  it("bolo mostra foto de bolo", () => expect(dishKind("Bolo de cenoura")).toBe("bolo"));
  it("lê ingredientes e passos", () => {
    const p = recipeParts("## Omelete\nServe 2 porções\n**Ingredientes:**\n- 3 ovos\n- sal\n**Modo de preparo:**\n1. Bata os ovos.\n2. Leve à frigideira.\n");
    expect(p.ingredients).toEqual(["3 ovos", "sal"]);
    expect(p.steps).toEqual(["Bata os ovos.", "Leve à frigideira."]);
    expect(p.servings).toBe(2);
  });
  it("tira quantidade para a lista", () => expect(ingredientName("2 xícaras de farinha")).toEqual({ name: "farinha", quantity: "2 xícaras" }));
});
