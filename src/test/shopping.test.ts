import { describe, expect, it } from "vitest";
import { groupShopping, shoppingEstimate, marketNotes, marketListText } from "@/lib/shopping";

describe("Smart shopping", () => {
  const items = [{ name: "Cenoura", quantity: "500 g", sector: "Hortifruti", estimated_price: 4 }, { name: "Frango", quantity: "1 kg", sector: "Açougue", estimated_price: 18 }, { name: "Farinha", sector: "Mercearia", estimated_price: null }, { name: "Pão", sector: "Padaria", estimated_price: 6, checked: true }];
  it("groups by the requested market sectors", () => {
    expect(groupShopping(items).map((g) => [g.sector, g.items[0]?.name])).toEqual([["Hortifruti", "Cenoura"], ["Açougue", "Frango"], ["Mercearia", "Farinha"], ["Padaria", "Pão"]]);
  });
  it("estimates missing purchases only and reports unknown prices", () => {
    expect(shoppingEstimate(items)).toEqual({ total: 22, missing: 1 });
  });
  it("attaches quantities and sectors to market appointment notes", () => {
    const notes = marketNotes("Mercado do bairro", items);
    expect(notes).toContain("Mercado do bairro");
    expect(notes).toContain("Hortifruti: Cenoura (500 g)");
    expect(notes).toContain("Açougue: Frango (1 kg)");
    expect(notes).not.toContain("Padaria: Pão");
  });
  it("includes the market list in reminder text with prices marked approximate", () => {
    const reminder = marketListText(items);
    expect(reminder).toContain("preços aproximados, não cotações");
    expect(reminder).toContain("Cenoura (500 g)");
    expect(reminder).toContain("Farinha");
  });
});