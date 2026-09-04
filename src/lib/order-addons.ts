import { cartTotal, type CartLine } from "./cart";

export type OrderAddon = {
  id: string;
  name: string;
  detail: string;
  price: number;
  kind: "drink" | "dessert";
};

export type AddonSelection = {
  drinkId: string | null;
  dessertId: string | null;
};

export const orderAddons: OrderAddon[] = [
  { id: "water", name: "Eau fraîche", detail: "50 cl", price: 1.2, kind: "drink" },
  { id: "citronnade", name: "Citronnade", detail: "Maison · 33 cl", price: 1.8, kind: "drink" },
  { id: "cola", name: "Cola", detail: "33 cl", price: 2, kind: "drink" },
  { id: "cookie", name: "Cookie choco", detail: "Cœur fondant", price: 1.9, kind: "dessert" },
  { id: "tiramisu", name: "Tiramisu", detail: "Pot maison", price: 3.2, kind: "dessert" },
];

export const emptyAddonSelection: AddonSelection = {
  drinkId: null,
  dessertId: null,
};

export const COMBO_DISCOUNT = 0.5;

export function selectedAddons(selection: AddonSelection) {
  return [selection.drinkId, selection.dessertId]
    .map((id) => orderAddons.find((item) => item.id === id))
    .filter((item): item is OrderAddon => Boolean(item));
}

export function orderTotal(cart: CartLine[], selection: AddonSelection) {
  const addonsTotal = selectedAddons(selection).reduce((total, item) => total + item.price, 0);
  const discount = selection.drinkId && selection.dessertId ? COMBO_DISCOUNT : 0;
  return cartTotal(cart) + addonsTotal - discount;
}

export function parseStoredAddons(value: string | null): AddonSelection {
  if (!value) return emptyAddonSelection;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return emptyAddonSelection;
    const selection = parsed as Partial<AddonSelection>;
    const drinkIsValid = selection.drinkId === null
      || orderAddons.some((item) => item.kind === "drink" && item.id === selection.drinkId);
    const dessertIsValid = selection.dessertId === null
      || orderAddons.some((item) => item.kind === "dessert" && item.id === selection.dessertId);

    if (!drinkIsValid || !dessertIsValid) return emptyAddonSelection;
    return {
      drinkId: selection.drinkId ?? null,
      dessertId: selection.dessertId ?? null,
    };
  } catch {
    return emptyAddonSelection;
  }
}
