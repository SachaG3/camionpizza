import { describe, expect, it } from "vitest";

import { pizzas } from "../data/menu";
import { createDefaultCartLine, filterPizzas } from "./menu-actions";

describe("filterPizzas", () => {
  it("returns only vegetarian pizzas", () => {
    expect(filterPizzas(pizzas, "veggie").map((pizza) => pizza.id)).toEqual([
      "margherita",
      "veggie",
      "tomato",
      "four-cheese",
    ]);
  });

  it("returns only classic pizzas", () => {
    expect(filterPizzas(pizzas, "classic").map((pizza) => pizza.id)).toEqual([
      "margherita",
    ]);
  });

  it("returns only spicy pizzas", () => {
    expect(filterPizzas(pizzas, "spicy").map((pizza) => pizza.id)).toEqual([
      "pepperoni",
      "nduja",
    ]);
  });

  it("matches names and ingredients without accents or case sensitivity", () => {
    expect(filterPizzas(pizzas, "all", "  RECRE  ").map((pizza) => pizza.id)).toEqual([
      "pepperoni",
    ]);
    expect(filterPizzas(pizzas, "all", "tres bien").map((pizza) => pizza.id)).toEqual([
      "veggie",
    ]);
    expect(filterPizzas(pizzas, "all", "CHAMPIGNON").map((pizza) => pizza.id)).toEqual([
      "veggie",
    ]);
  });

  it("combines a category and a search query", () => {
    expect(filterPizzas(pizzas, "veggie", "basilic").map((pizza) => pizza.id)).toEqual([
      "margherita",
    ]);
    expect(filterPizzas(pizzas, "spicy", "basilic").map((pizza) => pizza.id)).toEqual([
      "nduja",
    ]);
  });
});

describe("createDefaultCartLine", () => {
  it("creates the standard solo tomato configuration", () => {
    expect(createDefaultCartLine(pizzas[1])).toEqual({
      id: "burrata-solo-tomate-none",
      pizzaId: "burrata",
      name: "La Boursière",
      image: "/images/pizza-burrata.jpg",
      unitPrice: 11.5,
      quantity: 1,
      details: ["Solo · 26 cm", "Tomate rôtie"],
    });
  });
});
