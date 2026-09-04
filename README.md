# Fourchette — Pizza campus

Prototype mobile-first d’un camion à pizzas destiné aux lycéens et étudiants. Le parcours principal permet de choisir le passage du camion, parcourir et rechercher huit recettes, ajouter directement une pizza ou la personnaliser, compléter la commande avec une boisson et un dessert, puis confirmer un créneau de retrait.

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

Le prototype couvre un catalogue de huit recettes avec recherche accent/casse tolérante, filtres combinables, configurateur, panier persistant, formule boisson-dessert avec remise, retrait et confirmation. Les compléments sont persistés avec le panier mais ne comptent pas comme des pizzas dans la fidélité. La commande reste possible sans compte ; un e-mail est alors demandé uniquement pour le récapitulatif.

Un compte facultatif permet de conserver côté serveur :

- la carte fidélité ;
- l’historique complet des commandes et leur statut ;
- le téléchargement de la facture PDF après récupération.

Les mots de passe sont hachés avec `scrypt`, les sessions aléatoires sont stockées sous forme de hash et le cookie est `HttpOnly`, `Secure`, `SameSite=Lax`. Les données de démonstration sont conservées dans `.data/`, ignoré par Git.

Les e-mails transactionnels utilisent le SMTP configuré dans `.env.local` : confirmation à la commande, puis facture PDF lorsque l’administration marque la commande comme récupérée. `/admin` propose une vue opérationnelle mobile/desktop, la progression des statuts et le renvoi manuel de chaque e-mail. Cet accès exige un compte dont le rôle persistant est `admin` ; le compte E2E local est provisionné dans `.data/admin-access.txt`, en mode `0600`.

Aucun paiement réel n’est connecté. Le prix est présenté comme payable au camion.
