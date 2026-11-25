import { describe, expect, it } from "vitest";
import { CHEF_RULES } from "@/lib/chef";

describe("Chef da ZELFA product rules", () => {
  it("requires at least three meal options from available ingredients", () => {
    expect(CHEF_RULES.minimumOptions).toBe(3);
  });
  it("covers carrot, orange, chocolate and corn cakes", () => {
    expect(CHEF_RULES.cakes).toEqual(["cenoura", "laranja", "chocolate", "milho"]);
  });
  it("covers brigadeiro, pudding and pies", () => {
    expect(CHEF_RULES.sweets).toEqual(["brigadeiro", "pudim", "tortas"]);
  });
  it("covers homemade, cheese, skillet and corn breads", () => {
    expect(CHEF_RULES.breads).toEqual(["caseiro", "pão de queijo", "frigideira", "milho"]);
  });
  it("offers all four requested adaptations", () => {
    expect(CHEF_RULES.adaptations).toEqual(["sem glúten", "sem lactose", "fit", "econômica"]);
  });
  it("automatically adds missing ingredients to shopping", () => {
    expect(CHEF_RULES.automaticShopping).toBe(true);
  });
  it("waits for the user before advancing guided cooking", () => {
    expect(CHEF_RULES.waitForNextStep).toBe(true);
  });
});