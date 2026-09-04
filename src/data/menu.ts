export type Pizza = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  accent: string;
  popular?: boolean;
  allergens: string[];
  availability?: "available" | "limited" | "sold_out";
};

export const pizzas: Pizza[] = [
  {
    id: "margherita",
    name: "La Major",
    description: "Tomate rôtie, fior di latte, basilic frais et huile d’olive.",
    price: 8.5,
    image: "/images/pizza-margherita.webp",
    tags: ["Classique", "Végé"],
    accent: "#d8452f",
    allergens: ["Gluten", "Lait"],
    popular: true,
  },
  {
    id: "burrata",
    name: "La Boursière",
    description: "Crème de parmesan, burrata, roquette et pesto de pistache.",
    price: 11.5,
    image: "/images/pizza-burrata.webp",
    tags: ["Crémeuse", "Signature"],
    accent: "#73964b",
    allergens: ["Gluten", "Lait", "Fruits à coque"],
  },
  {
    id: "pepperoni",
    name: "La Récré",
    description: "Tomate, mozzarella, pepperoni croustillant et miel pimenté.",
    price: 10,
    image: "/images/pizza-pepperoni.webp",
    tags: ["Épicée", "Best-seller"],
    accent: "#e66d2f",
    allergens: ["Gluten", "Lait"],
    popular: true,
  },
  {
    id: "veggie",
    name: "La Mention Très Bien",
    description: "Courgette, poivron, champignon, oignon rouge et feta.",
    price: 10.5,
    image: "/images/pizza-veggie.webp",
    tags: ["Végé", "Fraîche"],
    accent: "#4e7e55",
    allergens: ["Gluten", "Lait"],
  },
  {
    id: "nduja",
    name: "La Copie Double",
    description: "Tomate, mozzarella fumée, nduja relevée et basilic frais.",
    price: 10.5,
    image: "/images/pizza-diavola.webp",
    tags: ["Épicée", "Signature"],
    accent: "#c33b2a",
    allergens: ["Gluten", "Lait"],
  },
  {
    id: "chicken",
    name: "La Pause Déj’",
    description: "Poulet mariné, ananas rôti, oignon rouge et sauce barbecue.",
    price: 11,
    image: "/images/pizza-campus.webp",
    tags: ["Sucrée-salée", "Généreuse"],
    accent: "#dc7a2c",
    allergens: ["Gluten", "Lait"],
    popular: true,
  },
  {
    id: "tomato",
    name: "La Dernière Heure",
    description: "Tomates cerises, mozzarella, ail rôti, origan et huile verte.",
    price: 9.5,
    image: "/images/pizza-tomato.webp",
    tags: ["Végé", "Fraîche"],
    accent: "#c94b32",
    allergens: ["Gluten", "Lait"],
    availability: "limited",
  },
  {
    id: "four-cheese",
    name: "La Quatre Matières",
    description: "Mozzarella, chèvre, gorgonzola et parmesan affiné.",
    price: 11,
    image: "/images/pizza-four-cheese.webp",
    tags: ["Végé", "Crémeuse"],
    accent: "#bd8a3e",
    allergens: ["Gluten", "Lait"],
    availability: "sold_out",
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
