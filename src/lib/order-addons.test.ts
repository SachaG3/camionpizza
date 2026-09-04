import { describe, expect, it } from "vitest";

import { cartTotal, type CartLine } from "./cart";
import {
  emptyAddonSelection,
  orderTotal,
  parseStoredAddons,
  selectedAddons,
} from "./order-addons";

const cart: CartLine[] = [
  {
    id: "major-solo",
    pizzaId: "major",
    name: "La Major",
    image: "/major.jpg",
    unitPrice: 8.5,
    quantity: 2,
    details: ["Solo"],
  },
];

describe("order addons", () => {
  it("restores only known drink and dessert ids", () => {
    expect(parseStoredAddons('{"drinkId":"citronnade","dessertId":"cookie"}')).toEqual({
      drinkId: "citronnade",
      dessertId: "cookie",
    });
    expect(parseStoredAddons('{"drinkId":"energy-drink","dessertId":"cookie"}')).toEqual(
      emptyAddonSelection,
    );
    expect(parseStoredAddons("broken")).toEqual(emptyAddonSelection);
  });

  it("lists selected add-ons in order", () => {
    expect(selectedAddons({ drinkId: "citronnade", dessertId: "cookie" }).map((item) => item.id)).toEqual([
      "citronnade",
      "cookie",
    ]);
  });

  it("applies the student combo discount when a drink and dessert are selected", () => {
    expect(cartTotal(cart)).toBe(17);
    expect(orderTotal(cart, { drinkId: "citronnade", dessertId: "cookie" })).toBe(20.2);
    expect(orderTotal(cart, { drinkId: "water", dessertId: null })).toBe(18.2);
  });
});
