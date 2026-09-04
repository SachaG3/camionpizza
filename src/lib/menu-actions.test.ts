import { describe, expect, it } from "vitest";

import { pizzas } from "../data/menu";
import { createDefaultCartLine, filterPizzas } from "./menu-actions";

describe("filterPizzas", () => {
  it("returns only vegetarian pizzas", () => {
    expect(filterPizzas(pizzas, "veggie").map((pizza) => pizza.id)).toEqual([
      "margherita",
      "veggie",
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
