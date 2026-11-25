import { describe, it, expect } from "vitest";
import { buildRecipeEmail, recipeHtml } from "@/lib/notice-email";
const dec = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
describe("aviso de receita por e-mail", () => {
  it("vai só para o e-mail da própria conta", () => {
    expect(dec(buildRecipeEmail("a@b.com", "Bolo", "x"))).toMatch(/^To: a@b\.com\r\n/);
  });
  it("bloqueia e-mail com quebra de linha", () => {
    expect(() => buildRecipeEmail("a@b.com\r\nBcc: x@y.com", "Bolo", "x")).toThrow();
  });
  it("não deixa código da receita virar HTML", () => {
    expect(recipeHtml("<script>")).not.toContain("<script>");
  });
});
