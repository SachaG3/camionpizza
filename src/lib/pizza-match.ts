import { pizzas } from "../data/menu";
export type MatchAnswers = { diet: "veggie" | "all"; mood: "fresh" | "cream" | "fire"; budget: "ten" | "all" };
export function matchPizza(answers: MatchAnswers) {
  const candidates = pizzas.filter(p => p.availability !== "sold_out" && (answers.diet !== "veggie" || p.dietary.includes("Végétarien")) && (answers.budget !== "ten" || p.price <= 10));
  const preferences = { fresh: ["veggie", "tomato", "margherita"], cream: ["burrata", "four-cheese", "margherita"], fire: ["nduja", "pepperoni", "tomato"] }[answers.mood];
  const pizza = [...candidates].sort((a, b) => {
    const rank = (id: string) => preferences.includes(id) ? preferences.indexOf(id) : 99;
    return rank(a.id) - rank(b.id);
  })[0];
  return { pizza, profile: { fresh: "L’esprit libre", cream: "L’épicurien du campus", fire: "L’audace au menu" }[answers.mood] };
}
