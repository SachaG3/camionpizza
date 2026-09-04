import { bases, sizes, type Pizza } from "../data/menu";
import type { CartLine } from "./cart";

export type MenuFilter = "all" | "classic" | "veggie" | "spicy";

const tagsByFilter: Record<Exclude<MenuFilter, "all">, string> = {
  classic: "Classique",
  veggie: "Végé",
  spicy: "Épicée",
};

export function filterPizzas(menu: Pizza[], filter: MenuFilter) {
  if (filter === "all") return menu;
  return menu.filter((pizza) => pizza.tags.includes(tagsByFilter[filter]));
}

export function createDefaultCartLine(pizza: Pizza): CartLine {
  const size = sizes[0];
  const base = bases[0];
  return {
    id: `${pizza.id}-${size.id}-${base.id}-none`,
    pizzaId: pizza.id,
    name: pizza.name,
    image: pizza.image,
    unitPrice: pizza.price + size.price + base.price,
    quantity: 1,
    details: [`${size.label} · ${size.detail}`, base.label],
  };
}
