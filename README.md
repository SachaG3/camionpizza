# Fourchette — Pizza campus

Prototype mobile-first d’un camion à pizzas destiné aux lycéens et étudiants. Le parcours principal permet de filtrer la carte, ajouter directement une recette ou personnaliser une pizza (taille, base, protéine et garnitures), calculer son prix, gérer un panier persistant et confirmer un créneau de retrait.

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
- React Hook Form et Zod pour les formulaires et la validation des API
- Embla Carousel, prêt pour une évolution de la carte

## MCP du projet

Les lanceurs reproductibles sont dans `tooling/mcp/` :

- `shadcn.sh`
- `nextjs.sh`
- `playwright.sh`
- `context7.sh`

Ils sont enregistrés dans Hermes sous les noms `pizza-shadcn`, `pizza-nextjs`, `pizza-playwright` et `pizza-context7`.

## Portée actuelle

Le prototype couvre le catalogue, le configurateur, le panier persistant, le retrait et une confirmation de commande simulée. La commande reste possible sans compte. Un compte facultatif permet de conserver une carte fidélité côté serveur : mots de passe hachés avec `scrypt`, sessions aléatoires stockées sous forme de hash et cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Les comptes de démonstration sont conservés dans `.data/`, ignoré par Git.

Aucun paiement réel n’est connecté.
