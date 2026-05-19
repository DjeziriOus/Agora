# Module : `frontend/app/(client)/`

## 1. Objectifs du module

Regroupe toutes les **pages côté acheteur** :
- Catalogue, recherche, boutique, fiche produit
- Panier, checkout, confirmation
- Espace compte (profil, adresses, commandes, paramètres)

C'est un groupe Next.js — les parenthèses n'apparaissent PAS dans l'URL.

## 2. Relations d'utilisation

### Modules utilisés par ces pages

- `next/navigation`, `next/link`, `next/image`
- `@/context/AuthContext` — `useAuth`
- `@/hooks/useCart` — gestion du panier
- `@/hooks/useApi` — React Query (`useProducts`, `useProduct`, `useStore`, etc.)
- `@/lib/api` — appels HTTP directs si nécessaire
- `@/components/*` — Navbar, Footer, ProductCard, StarRating, etc.
- `lucide-react`, `sonner` — UI

### Modules qui utilisent ce dossier

Aucun (pages = point d'entrée du routing).

## 3. Pages exposées

### Layout

| Fichier | Rôle |
|---------|------|
| `layout.tsx` | Layout commun : Navbar + Footer + zone enfant |

### Pages publiques (lecture seule)

| Chemin | URL | Rôle |
|--------|-----|------|
| `catalogue/page.tsx` | `/catalogue` | Liste paginée avec filtres |
| `boutique/[slug]/page.tsx` | `/boutique/[slug]` | Storefront d'une boutique |
| `produit/[id]/page.tsx` | `/produit/[id]` | Fiche détaillée d'un produit |
| `recherche/page.tsx` | `/recherche` | Page de recherche (alternative au catalogue) |

### Pages d'achat (auth requise)

| Chemin | URL | Rôle |
|--------|-----|------|
| `panier/page.tsx` | `/panier` | Vue panier (modifier quantités, retirer, sélectionner) |
| `checkout/page.tsx` | `/checkout` | Choix adresse de livraison + création de commande |
| `confirmation/[orderId]/page.tsx` | `/confirmation/[orderId]` | Récap après commande |

### Pages "Mon compte"

| Chemin | URL | Rôle |
|--------|-----|------|
| `compte/layout.tsx` + `AccountLayoutClient.tsx` | — | Layout avec sidebar de navigation compte |
| `compte/page.tsx` | `/compte` | Vue d'ensemble + édition profil |
| `compte/adresses/page.tsx` | `/compte/adresses` | CRUD adresses |
| `compte/commandes/page.tsx` | `/compte/commandes` | Liste des commandes de l'acheteur |
| `compte/commandes/[id]/page.tsx` | `/compte/commandes/[id]` | Détail d'une commande |
| `compte/parametres/page.tsx` | `/compte/parametres` | Mot de passe, suppression compte |

## 4. Procédures externes

Les pages exportent une fonction default (le composant React). Pas d'autre export.

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Layout commun

`(client)/layout.tsx` injecte la `Navbar` et le `Footer` pour toutes les pages enfants. Le panier est accessible depuis la Navbar (badge avec compteur).

### Protection des routes côté frontend

Les pages d'achat (`/panier`, `/checkout`) ne sont **pas physiquement protégées** côté Next.js. Le contenu est rendu mais les appels API du backend retournent 401, qui sont catchés et affichent un toast / une redirection.

Pour les routes d'achat ET les routes `/compte/*`, le composant `AccountLayoutClient` redirige vers `/login` si `!isAuthenticated`.

### Page produit `/produit/[id]`

- Lit l'ID dans l'URL.
- Appelle `useProduct(id)` (React Query → `productsApi.getById`).
- Affiche les images, la description, le sélecteur de variantes, le bouton « Ajouter au panier ».
- Affiche aussi les produits similaires (même catégorie).

### Page panier `/panier`

- Lit le panier via `useCart()` (le hook React Query, pas le contexte legacy).
- Permet de modifier les quantités → appelle `cartApi.updateQuantity` (optimistic update).
- Permet de retirer → `cartApi.remove`.
- Permet de cocher/décocher → `cartApi.toggleSelected`.
- Bouton « Passer commande » → redirige vers `/checkout`.

### Page checkout `/checkout`

- Charge `cartApi.getCheckoutSummary` pour avoir UNIQUEMENT les items sélectionnés.
- Affiche le sélecteur d'adresse de livraison (via `addressesApi.getAll`).
- Permet de créer une nouvelle adresse à la volée.
- Bouton « Confirmer la commande » → `ordersApi.create({ items, deliveryAddress })`.
- Sur succès → redirige vers `/confirmation/[orderId]`.

### Page confirmation `/confirmation/[orderId]`

Affiche un récap visuel de la commande. Lit l'ID dans l'URL et fait un GET sur le détail.

### `/recherche` vs `/catalogue` ?

Les deux pages affichent une grille de produits avec filtres. Différences subtiles :
- `/recherche` est typiquement atteinte depuis la Navbar (avec un `?q=...`).
- `/catalogue` est la vue de browse globale.

En pratique, leur contenu est très similaire. Si on voulait simplifier, on pourrait fusionner.
