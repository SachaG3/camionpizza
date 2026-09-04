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
npm run test:e2e
```

## Stack

- Next.js, React et TypeScript
- Tailwind CSS et shadcn/ui
- Motion et Lucide
- React Hook Form et Zod pour les formulaires et la validation des API
- Embla Carousel, prêt pour une évolution de la carte
- SQLite en mode WAL pour les comptes, sessions, commandes et la file d’e-mails
- Playwright et axe-core pour le parcours mobile et l’accessibilité

## MCP du projet

Les lanceurs reproductibles sont dans `tooling/mcp/` :

- `shadcn.sh`
- `nextjs.sh`
- `playwright.sh`
- `context7.sh`

Ils sont enregistrés dans Hermes sous les noms `pizza-shadcn`, `pizza-nextjs`, `pizza-playwright` et `pizza-context7`.

## Portée actuelle

Le prototype couvre un catalogue de huit recettes avec recherche accent/casse tolérante, filtres combinables, allergènes, disponibilités, configurateur, panier persistant, formule boisson-dessert avec remise, instructions cuisine, capacité par créneau, estimation de préparation, retrait et confirmation avec QR code. Les compléments sont persistés avec le panier mais ne comptent pas comme des pizzas dans la fidélité. La commande reste possible sans compte ; un e-mail est alors demandé uniquement pour le récapitulatif.

Un compte facultatif permet de conserver côté serveur :

- la carte fidélité ;
- l’historique complet des commandes et leur statut ;
- l’annulation avant préparation et la nouvelle commande depuis l’historique ;
- le téléchargement de la facture PDF après récupération.

Les mots de passe sont hachés avec `scrypt`, les sessions aléatoires sont stockées sous forme de hash et le cookie est `HttpOnly`, `Secure`, `SameSite=Lax`. Les données de démonstration sont conservées dans `.data/fourchette.db`, ignoré par Git. Au premier démarrage, les anciens fichiers JSON sont repris automatiquement une seule fois.

Les e-mails transactionnels utilisent le SMTP configuré dans `.env.local`. Une outbox SQLite détache l’envoi de la réponse HTTP, conserve les échecs et effectue jusqu’à quatre tentatives : confirmation à la commande, notification lorsqu’elle est prête, puis facture PDF après récupération. `/admin` propose des colonnes opérationnelles, un rafraîchissement automatique, un signal sonore facultatif, les temps d’attente, l’impression ticket, des statistiques, un journal d’e-mails et leurs renvois manuels. Cet accès exige un compte dont le rôle persistant est `admin` ; le compte E2E local est provisionné dans `.data/admin-access.txt`, en mode `0600`.

L’application fournit un manifeste installable et un service worker avec une carte minimale disponible hors connexion. Les photos WebP représentent environ la moitié du poids des fichiers JPEG d’origine et les dialogues secondaires sont chargés à la demande.

Aucun paiement réel n’est connecté. Le prix est présenté comme payable au camion.
