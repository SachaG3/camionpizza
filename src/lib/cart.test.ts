import { describe, expect, it } from "vitest";

import {
  addCartLine,
  cartCount,
  cartTotal,
  changeCartLineQuantity,
  parseStoredCart,
  type CartLine,
} from "./cart";

const line: CartLine = {
  id: "major-solo",
  pizzaId: "margherita",
  name: "La Major",
  image: "/images/pizza-margherita.jpg",
  unitPrice: 8.5,
  quantity: 2,
  details: ["Solo", "Tomate rôtie"],
};

describe("cart totals", () => {
  it("computes item count and monetary total", () => {
    const cart = [line, { ...line, id: "recre-maxi", unitPrice: 13, quantity: 1 }];

    expect(cartCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(30);
  });
});

describe("addCartLine", () => {
  it("merges identical configurations and preserves distinct ones", () => {
    const merged = addCartLine([line], { ...line, quantity: 1 });
    const distinct = addCartLine(merged, { ...line, id: "major-maxi", quantity: 1 });

    expect(merged).toEqual([{ ...line, quantity: 3 }]);
    expect(distinct).toHaveLength(2);
  });
});

describe("changeCartLineQuantity", () => {
  it("updates the requested line without mutating the cart", () => {
    const cart = [line];
    const updated = changeCartLineQuantity(cart, line.id, 1);

    expect(updated[0].quantity).toBe(3);
    expect(cart[0].quantity).toBe(2);
  });

  it("removes a line when its quantity reaches zero", () => {
    expect(changeCartLineQuantity([{ ...line, quantity: 1 }], line.id, -1)).toEqual([]);
  });
});

describe("parseStoredCart", () => {
  it("restores valid cart lines", () => {
    expect(parseStoredCart(JSON.stringify([line]))).toEqual([line]);
  });

  it("rejects malformed or invalid persisted data", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ name: "Incomplete" }]))).toEqual([]);
  });
});
