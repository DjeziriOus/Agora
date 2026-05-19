# Module : `frontend/src/hooks/` (+ `frontend/hooks/`)

## 1. Objectifs du module

Regroupe les **hooks React custom** du projet. Deux dossiers existent (historique) :

- `frontend/src/hooks/` — hooks métier (`useApi`, `useCart`, `useInView`)
- `frontend/hooks/` — hooks UI (`use-mobile`, `use-toast`)

## 2. Hooks listés

### `useApi.ts` (`src/hooks/`)

Hooks **React Query** pour TOUS les endpoints backend. C'est le hub principal.

| Hook | But |
|------|-----|
| `useProducts(params?)` | Catalogue paginé |
| `useProduct(id)` | Détail d'un produit |
| `useSellerProduct(id)` | Détail produit vendeur (avec stock) |
| `useSellerProducts(params?, options?)` | Inventaire vendeur |
| `useLowStockProducts(options?)` | Produits avec stock bas |
| `useCreateProduct()` | Mutation : créer un produit |
| `useUpdateProduct()` | Mutation : modifier |
| `useToggleProductActive()` | Mutation : activer/désactiver |
| `useDeleteProduct()` | Mutation : supprimer |
| `useStore(id)` | Détail boutique |
| `useStoreProducts(id, params?)` | Produits d'une boutique |
| `useMyStore(options?)` | Boutique du vendeur connecté |
| `useCreateStore()` | Mutation : créer une boutique |
| `useUpdateStore()` | Mutation : modifier |
| `useCategories()` | Catégories (constantes locales) |
| `useClientOrders()` | Historique acheteur |
| `useOrder(id)` | Détail commande |
| `useSellerOrders(options?)` | Liste vendeur |
| `useSellerOrder(id)` | Détail sous-commande |
| `useCreateOrder()` | Mutation : créer une commande |
| `useUpdateOrderStatus()` | Mutation : changer statut |
| `useCart()` | Panier (legacy, voir ci-dessous) |
| `useAddToCart()`, `useUpdateCartQuantity()`, etc. | Mutations panier (legacy) |
| `useVendorStats()` | Statistiques boutique |
| `useStockStats(options?)` | Stats stock |

Tous suivent les patterns React Query : `useQuery` pour les lectures, `useMutation` pour les écritures avec invalidation du cache après succès.

### `useCart.ts` (`src/hooks/`)

Le hook **moderne** pour le panier, avec optimistic updates et rollback. C'est celui à utiliser dans tout nouveau code.

Voir `docs/05-flux-panier-commande.md` pour le détail des mutations.

Exports :
- `useCart()` (hook unique qui regroupe data + actions)

### `useInView.ts` (`src/hooks/`)

Hook utilitaire qui détecte si un élément est dans le viewport (via `IntersectionObserver`).

Signature :
```ts
const { ref, inView } = useInView({ threshold?, rootMargin?, once? });
```

Utilisé pour les animations « fade in » au scroll (landing page).

### `use-mobile.ts` (`hooks/`)

Hook qui retourne `true` si la viewport est < 768px de large.

Utilisé par les composants UI (Navbar, Sidebar) pour adapter le rendu mobile.

### `use-toast.ts` (`hooks/`)

Hook de gestion de toasts inspiré de `react-hot-toast`. **Mais le projet utilise principalement `sonner`** pour les toasts (importé dans `layout.tsx`). Ce hook est plutôt dormant — il est gardé parce que certains composants shadcn (`Toaster`, `Toast`) y font référence.

## 3. Relations d'utilisation

### Modules utilisés

- `@tanstack/react-query` — pour `useApi` et `useCart`
- `@/lib/api` — appels HTTP
- `@/context/AuthContext` — pour `useCart` (vérifie auth/role)
- `react` — base

### Modules qui utilisent ces hooks

Pratiquement tous les composants client et toutes les pages.

## 4. Procédures externes

Voir les listes ci-dessus.

## 5. Variables externes

### `queryKeys` (exporté de `useApi.ts`)

```ts
{
  products: { all, list(params), detail(id), seller, lowStock, ... },
  stores: { detail(id), products(id, params), my },
  categories: { all },
  orders: { buyer, detail(id), seller, sellerDetail(id) },
  vendor: { stats },
  auth: { me },
}
```

C'est l'objet centralisé des clés de cache React Query. Toujours l'utiliser plutôt que d'écrire les clés à la main, pour garantir l'invalidation cross-composant.

## 6. Notes d'implémentation

### Pourquoi 2 dossiers `hooks/` ?

Historique. `frontend/hooks/` vient du template initial Next.js + shadcn. `frontend/src/hooks/` a été ajouté plus tard pour les hooks métier. Pas de raison technique de les séparer — à fusionner un jour.

### Pourquoi 2 `useCart` ?

- `useCart` de `@/context/CartContext` — legacy, n'utilise pas React Query.
- `useCart` de `@/hooks/useCart` — moderne, optimistic, rollback, etc.

Plus l'un d'eux ne devrait être utilisé (le moderne). L'ancien est gardé pour compat. À nettoyer.

### `queryKeys` est central

Toutes les mutations utilisent `queryClient.invalidateQueries({ queryKey: queryKeys.X })` pour invalider les caches concernés. Sans ça, après une mutation, l'UI continuerait d'afficher les anciennes données.

Par exemple, `useUpdateOrderStatus` invalide :
- `queryKeys.orders.seller` (liste générale)
- `queryKeys.orders.sellerDetail(id)` (le détail spécifique)

### Pattern de hook avec `options?: { enabled?: boolean }`

Certains hooks (`useSellerProducts`, `useMyStore`, `useLowStockProducts`, etc.) acceptent `options.enabled`. Permet aux composants de désactiver la requête conditionnellement (par exemple ne pas charger les produits du vendeur si on n'a pas encore confirmé qu'il a une boutique).

```ts
const { data: store } = useMyStore({ enabled: isSeller });
const hasStore = !!store;
const { data: products } = useSellerProducts(undefined, { enabled: hasStore });
```

### `keepPreviousData`

`useSellerProducts` utilise `placeholderData: keepPreviousData`. Avantage : quand l'utilisateur change de page (pagination), il voit l'ancien contenu jusqu'à ce que le nouveau soit chargé, au lieu d'un flash de loader. UX plus agréable.

### Pas de typage strict sur tous les retours

Quelques hooks utilisent `useQuery<any>` ou `useMutation<unknown>`. C'est dû à des refactors incomplets. Les types sont parfois définis sur `apiFetch` mais perdus en route. À durcir dans un futur refactor.
