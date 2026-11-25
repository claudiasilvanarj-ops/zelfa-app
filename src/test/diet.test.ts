import { describe, expect, it } from "vitest";
import { conflicts, isAllowed } from "@/lib/diet";

describe("filtro de restrições", () => {
  it("receita vegana com leite, ovo ou mel é bloqueada", () => {
    expect(isAllowed(["2 xícaras de leite"], ["vegano"])).toBe(false);
    expect(isAllowed(["3 ovos"], ["vegano"])).toBe(false);
    expect(isAllowed(["1 colher de mel"], ["vegano"])).toBe(false);
    expect(isAllowed(["gelatina incolor"], ["vegano"])).toBe(false);
  });
  it("receita vegana só com vegetais passa, inclusive leite de coco", () => {
    expect(isAllowed(["leite de coco", "grão-de-bico", "azeite"], ["vegano"])).toBe(true);
  });
  it("sem glúten bloqueia trigo, centeio, cevada e aveia comum", () => {
    for (const i of ["farinha de trigo", "centeio", "cevada", "aveia em flocos"]) expect(isAllowed([i], ["gluten"])).toBe(false);
    expect(isAllowed(["aveia sem glúten", "polvilho"], ["gluten"])).toBe(true);
  });
  it("aponta o ingrediente em conflito com a alergia", () => {
    expect(conflicts(["amendoim torrado", "arroz"], ["amendoim"])).toEqual([{ ingredient: "amendoim torrado", restriction: "amendoim" }]);
  });
});

import { guardRecipes } from "@/lib/diet";
const md = `Atenção: a carne moída não é vegana.
### Picadinho
Ingredientes:
- 500 g de carne moída
- 2 batatas
Modo de preparo:
1. Refogue.
### Sopa cremosa de cenoura
Ingredientes:
- 3 cenouras
- 2 batatas
Substituições:
- leite → leite vegetal
Modo de preparo:
1. Cozinhe.`;
describe("camada 2: exibição", () => {
  it("vegano bloqueia o picadinho e libera a sopa com selo", () => {
    const r = guardRecipes(md, ["vegano"]);
    expect(r.blocked).toBe(1);
    expect(r.markdown).not.toContain("### Picadinho");
    expect(r.markdown).toContain("### Sopa cremosa de cenoura\n\n**✅ Vegano**");
  });
  it("sem restrição mostra o picadinho normalmente", () => {
    expect(guardRecipes(md, []).markdown).toBe(md);
  });
  it("lactose bloqueia receita com leite", () => {
    const r = guardRecipes("### Purê\nIngredientes:\n- 1 xícara de leite\n- batatas\nModo de preparo:\n1. Amasse.", ["lactose"]);
    expect(r.blocked).toBe(1);
  });
});

describe("camada 2: sugestões curtas", () => {
  const preview = "Opções:\n\n1. **Picadinho de carne moída**\nRefogado com batata.\n\n2. **Sopa cremosa de cenoura**\nLeve e quentinha.";
  it("vegano bloqueia o título com carne e mantém a sopa", () => {
    const r = guardRecipes(preview, ["vegano"]);
    expect(r.markdown).not.toContain("Refogado com batata");
    expect(r.markdown).toContain("Sopa cremosa de cenoura");
  });
  it("substituição 'leite → leite vegetal' não bloqueia receita vegana", () => {
    const r = guardRecipes("### Bolo\nIngredientes:\n- cenoura\nSubstituições:\n- **leite** → leite vegetal", ["vegano"]);
    expect(r.blocked).toBe(0);
  });
});
