import { describe, expect, it } from "vitest";
import { buildCaption, firstName, initialStatus, isOfficialRecipe, postTitle } from "@/lib/dish-community";
import { RECIPES } from "@/lib/recipes";

describe("fotos da comunidade", () => {
  it("receita oficial não aceita foto da usuária", () => expect(isOfficialRecipe(RECIPES[0]!.name)).toBe(true));
  it("receita criada para a usuária aceita foto", () => expect(isOfficialRecipe("Omelete da geladeira da Maria")).toBe(false));
  it("sem autorização a foto fica privada", () => expect(initialStatus(false)).toBe("privada"));
  it("com autorização vai para a fila pendente", () => expect(initialStatus(true)).toBe("pendente"));
  it("usa só o primeiro nome", () => expect(firstName("maria das graças")).toBe("Maria"));
  it("título do post", () => expect(postTitle("Omelete", "Maria Silva")).toBe("Omelete por Maria 💛"));
  it("legenda sugerida", () => expect(buildCaption("Maria", "Omelete")).toBe("Olha o que Maria fez com a ZELFA! 💛🍳 Omelete — faça o seu também: zelfa.app"));
});
