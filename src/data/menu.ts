export type Pizza = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  accent: string;
  popular?: boolean;
};

export const pizzas: Pizza[] = [
  {
    id: "margherita",
    name: "La Major",
    description: "Tomate rôtie, fior di latte, basilic frais et huile d’olive.",
    price: 8.5,
    image: "/images/pizza-margherita.jpg",
    tags: ["Classique", "Végé"],
    accent: "#d8452f",
    popular: true,
  },
  {
    id: "burrata",
    name: "La Boursière",
    description: "Crème de parmesan, burrata, roquette et pesto de pistache.",
    price: 11.5,
    image: "/images/pizza-burrata.jpg",
    tags: ["Crémeuse", "Signature"],
    accent: "#73964b",
  },
  {
    id: "pepperoni",
    name: "La Récré",
    description: "Tomate, mozzarella, pepperoni croustillant et miel pimenté.",
    price: 10,
    image: "/images/pizza-pepperoni.jpg",
    tags: ["Épicée", "Best-seller"],
    accent: "#e66d2f",
    popular: true,
  },
  {
    id: "veggie",
    name: "La Mention Très Bien",
    description: "Courgette, poivron, champignon, oignon rouge et feta.",
    price: 10.5,
    image: "/images/pizza-veggie.jpg",
    tags: ["Végé", "Fraîche"],
    accent: "#4e7e55",
  },
];

export const sizes = [
  { id: "solo", label: "Solo", detail: "26 cm", price: 0 },
  { id: "maxi", label: "Maxi", detail: "33 cm", price: 3 },
];

export const bases = [
  { id: "tomate", label: "Tomate rôtie", price: 0 },
  { id: "creme", label: "Crème légère", price: 1 },
  { id: "pesto", label: "Pesto verde", price: 1.5 },
];

export const proteins = [
  { id: "none", label: "Sans protéine", price: 0 },
  { id: "chicken", label: "Poulet mariné", price: 2.5 },
  { id: "pepperoni", label: "Pepperoni", price: 2 },
  { id: "tuna", label: "Thon", price: 2 },
];

export const toppings = [
  { id: "mushroom", label: "Champignons", price: 0.8 },
  { id: "pepper", label: "Poivrons", price: 0.8 },
  { id: "onion", label: "Oignons rouges", price: 0.6 },
  { id: "olive", label: "Olives", price: 0.7 },
  { id: "goat", label: "Chèvre", price: 1.2 },
  { id: "mozzarella", label: "Extra mozzarella", price: 1.3 },
];
