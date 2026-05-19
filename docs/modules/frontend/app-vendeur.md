# Module : `frontend/app/vendeur/`

## 1. Objectifs du module

Regroupe toutes les **pages de l'espace vendeur** : dashboard, boutique, produits, stock, commandes, paramètres.

⚠️ **Ce dossier n'a PAS de parenthèses** dans son nom, donc `/vendeur/...` apparait dans les URLs.

## 2. Relations d'utilisation

### Modules utilisés par ces pages

- `next/navigation`, `next/link`
- `@/context/AuthContext` — `useAuth`
- `@/hooks/useApi` — `useMyStore`, `useSellerProducts`, `useSellerOrders`, `useVendorStats`, etc.
- `@/lib/api` — `shopsApi`, `productsApi`, `ordersApi`
- `@/components/VendorSidebar` — sidebar latérale
- `@/components/ui/*` — wrappers shadcn

### Modules qui utilisent ce dossier

Aucun (pages = point d'entrée).

## 3. Pages exposées

### Layout

| Fichier | Rôle |
|---------|------|
| `layout.tsx` + `VendorLayoutClient.tsx` | Layout vendeur : sidebar + zone enfant, gardes d'accès |

### Pages

| Chemin | URL | Rôle |
|--------|-----|------|
| `page.tsx` | `/vendeur` | Dashboard : stats CA, commandes, stock |
| `boutique/page.tsx` | `/vendeur/boutique` | Création / édition de la boutique |
| `produits/page.tsx` | `/vendeur/produits` | Inventaire complet, recherche, filtres |
| `produits/nouveau/page.tsx` | `/vendeur/produits/nouveau` | Création d'un nouveau produit |
| `produits/[id]/page.tsx` | `/vendeur/produits/[id]` | Édition d'un produit |
| `stock/page.tsx` | `/vendeur/stock` | Vue des produits avec stock bas |
| `commandes/page.tsx` | `/vendeur/commandes` | Liste des sous-commandes |
| `commandes/[id]/page.tsx` | `/vendeur/commandes/[id]` | Détail + changement de statut |
| `parametres/page.tsx` | `/vendeur/parametres` | Mot de passe, suppression compte |

## 4. Procédures externes

Chaque page exporte un composant React default. Pas d'autre export.

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `VendorLayoutClient` — gardien d'accès

Ce composant client (dans le layout) :
1. Vérifie que `isAuthenticated` (sinon redirige vers `/login`).
2. Vérifie que `role === "seller"` (sinon redirige vers `/`).
3. Affiche la `VendorSidebar` + le contenu.

### Garde « boutique requise »

Le `VendorSidebar` détecte si le vendeur a déjà une boutique (via `useMyStore`). Tant qu'il n'en a pas :
- Les liens vers `/vendeur/produits`, `/vendeur/stock`, `/vendeur/commandes` sont MASQUÉS.
- Seuls `/vendeur/boutique` (créer) et `/vendeur/parametres` sont accessibles.

C'est un UX qui force le vendeur à créer sa boutique avant tout le reste.

### Création de produit `/vendeur/produits/nouveau`

Page complexe avec :
- Upload de plusieurs images (drag & drop ou parcourir).
- Tableau dynamique de variantes (ajouter, modifier, supprimer des lignes).
- Champs produit : nom, description, catégorie, seuil de stock bas.

Le formulaire envoie un `FormData` (multipart) à `productsApi.create()`.

Le champ `variants` est **stringifié en JSON** avant d'être ajouté au FormData (parce que FormData ne supporte pas les structures imbriquées).

### Édition de produit `/vendeur/produits/[id]`

Similaire à la création, avec en plus :
- Pré-chargement des données via `useSellerProduct(id)`.
- Gestion fine des images existantes : on construit un tableau `keepImages` (publicIds des images à garder) qu'on envoie avec les nouveaux fichiers.
- Toggle « Actif / Inactif ».
- Bouton « Supprimer définitivement ».

### Détail commande `/vendeur/commandes/[id]`

- Charge la sous-commande via `useSellerOrder(id)`.
- Affiche les articles, l'adresse, les coordonnées acheteur.
- Sélecteur de statut avec validation côté client (workflow logique : on ne peut pas passer de `livree` à `en_preparation`).
- Bouton de mise à jour → `ordersApi.updateStatus(id, status)`.

### Dashboard `/vendeur`

Vue d'ensemble visuelle :
- Cards de stats : CA, commandes du jour, commandes en attente, produits actifs.
- Tableau des commandes récentes.
- Alertes stock bas (avec lien vers `/vendeur/stock`).

Les données viennent de `useVendorStats` et `useStockStats`.

### `/vendeur/stock`

Liste les produits où **au moins une variante** a un stock ≤ `stockThreshold`. Permet une vue rapide des références à recharger.

Utilise `useLowStockProducts` (= `useSellerProducts({ lowStock: 'true' })`).
