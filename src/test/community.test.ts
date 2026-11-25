import { describe, expect, it } from "vitest";
import { CAPTION, DIRECT_LINK, isCelebration } from "@/lib/community";
describe("comunidade", () => {
  it("abre o Direct oficial", () => expect(DIRECT_LINK).toBe("https://ig.me/m/universozelfa"));
  it("legenda pronta", () => expect(CAPTION).toBe("Fiz esse prato com a ZELFA, minha chef de cozinha virtual! 🍳💛 #ZelfaChef @universozelfa"));
  it("convite aparece na celebração final", () => {
    expect(isCelebration("Prontinho! Que tal mostrar seu prato para a gente? 💛")).toBe(true);
    expect(isCelebration("Passo 2: misture a farinha.")).toBe(false);
  });
});
