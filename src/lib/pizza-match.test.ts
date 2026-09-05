import { expect, it } from "vitest";
import { matchPizza } from "./pizza-match";
it("keeps vegetarian recommendations vegetarian even with spicy preference", () => {
  expect(matchPizza({ diet: "veggie", mood: "fire", budget: "all" }).pizza.dietary).toContain("Végétarien");
});
it("respects a ten euro maximum and excludes sold out recipes", () => {
  const result = matchPizza({ diet: "all", mood: "cream", budget: "ten" });
  expect(result.pizza.price).toBeLessThanOrEqual(10);
  expect(result.pizza.availability).not.toBe("sold_out");
});
it("recommends a signature spicy recipe for adventurous eaters", () => {
  expect(matchPizza({ diet: "all", mood: "fire", budget: "all" }).pizza.id).toBe("nduja");
});
