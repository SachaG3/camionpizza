# Fourchette — Pizza campus

Prototype mobile-first d’un camion à pizzas destiné aux lycéens et étudiants. Le parcours principal permet de parcourir la carte, personnaliser une pizza (taille, base, protéine et garnitures), calculer son prix, gérer un panier persistant et confirmer un créneau de retrait.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir <http://localhost:3000>.

## Vérifications

```bash
npm run lint
npm test
npm run build
```

## Stack

- Next.js, React et TypeScript
- Tailwind CSS et shadcn/ui
- Motion et Lucide
- React Hook Form et Zod, prêts pour les futurs formulaires
- Embla Carousel, prêt pour une évolution de la carte

## MCP du projet

Les lanceurs reproductibles sont dans `tooling/mcp/` :

- `shadcn.sh`
- `nextjs.sh`
- `playwright.sh`
- `context7.sh`

Ils sont enregistrés dans Hermes sous les noms `pizza-shadcn`, `pizza-nextjs`, `pizza-playwright` et `pizza-context7`.

## Portée actuelle

Cette première tranche est un prototype frontend : catalogue, configurateur, calcul dynamique, panier persistant dans le navigateur et confirmation de commande simulée. Aucun paiement, compte ou backend n’est encore branché.
