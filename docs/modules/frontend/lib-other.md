# Modules : `frontend/src/lib/` (autres fichiers)

Ce document couvre les fichiers utilitaires de `frontend/src/lib/` qui n'ont pas leur propre page de doc.

## 📋 Liste des fichiers couverts

- `utils.ts`
- `queryClient.tsx`
- `productBrowse.ts`
- `productCategories.ts`
- `shopErrors.ts`
- `utils copy.ts` (dans `frontend/lib/`, legacy)

---

## `utils.ts`

### Objectifs

Helper minimal pour fusionner des classes Tailwind avec gestion des conflits.

### Export

```ts
function cn(...inputs: ClassValue[]): string
```

- Utilise `clsx` pour concaténer conditionnellement.
- Utilise `tailwind-merge` pour résoudre les conflits (ex. : `"px-2 px-4"` devient `"px-4"`).

### Utilisation

Partout dans les composants pour combiner les classes dynamiques :

```tsx
<div className={cn("base-class", isActive && "active-class", className)}>
```

---

## `queryClient.tsx`

### Objectifs

Wrapper React qui fournit un `QueryClientProvider` à toute l'application (React Query).

### Configuration par défaut

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,             // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

- **`staleTime: 1 min`** — les données restent fraîches 1 minute. Les hooks ne re-fetcheront pas dans cet intervalle.
- **`refetchOnWindowFocus: false`** — pas de re-fetch quand l'utilisateur revient sur l'onglet. Préférence pour la calme.
- **`retry: 1`** — 1 retry en cas d'erreur (puis on abandonne).

### Export

```ts
function QueryProvider({ children }: { children: ReactNode })
```

Utilisé dans `frontend/app/layout.tsx`.

---

## `productBrowse.ts`

### Objectifs

Helpers pour la navigation du catalogue (page d'accueil + page catalogue) :
- Calcul des catégories à partir d'une liste de produits.
- Filtrage de produits par chaîne de recherche.
- Calcul de produits liés (même catégorie).

### Exports

| Export | Signature | Rôle |
|--------|-----------|------|
| `PUBLIC_PRODUCTS_LIMIT` | `100` | Limite pour les pages publiques |
| `buildCategoriesFromProducts(products, limit?)` | `(products: Product[], limit?: number) => Category[]` | Compte les produits par catégorie, retourne les top N |
| `filterProductsBySearchQuery(products, query)` | `(products, query) => Product[]` | Filtre côté client (utilisé en complément de la recherche backend) |
| `getRelatedProducts(products, currentProduct, limit?)` | `(...) => Product[]` | Produits de la même catégorie, sauf le courant |

### Notes

- `buildCategoriesFromProducts` est utilisé sur la home pour afficher les "catégories phares" (en se basant sur ce qui est en stock).
- `filterProductsBySearchQuery` fait une recherche **côté client** (case-insensitive sur nom, description, catégorie, store). Utile pour des micro-recherches sur des données déjà chargées.

---

## `productCategories.ts`

### Objectifs

Liste **codée en dur** des catégories disponibles.

```ts
export const PRODUCT_CATEGORIES = [
  "Papeterie", "Maison", "Mode", "Bijoux", "Art",
  "Alimentation", "Beaute", "Jouets",
];
```

### Pourquoi codé en dur ?

Le backend n'a pas de collection `Category` séparée. La catégorie d'un produit est juste une string. Cette liste sert :
- À peupler les selects de catégorie dans les formulaires de produit.
- À afficher les catégories cliquables sur la home.

Si on veut ajouter une catégorie, c'est ici qu'on l'ajoute. C'est aussi pourquoi `useCategories` retourne ces constantes (et non une query backend).

---

## `shopErrors.ts`

### Objectifs

Helper de détection d'erreur spécifique : « le vendeur n'a pas de boutique ».

### Export

```ts
const isMissingSellerShopError = (error: unknown): boolean
```

Retourne `true` si `error instanceof ApiError && error.status === 404`.

### Utilisation

Dans `useMyStore`, on peut ignorer l'erreur si elle est due à l'absence de boutique (cas normal pour un vendeur qui vient de s'inscrire) :

```ts
shopsApi.getMyStore().catch((err) => {
  if (isMissingSellerShopError(err)) return null;
  throw err;
});
```

---

## `frontend/lib/utils copy.ts`

### Statut

⚠️ **Fichier orphelin**. C'est probablement une copie de `frontend/src/lib/utils.ts` créée par accident (le nom de fichier "utils copy.ts" est typique de Windows).

À supprimer dès qu'on est sûr qu'il n'est plus importé nulle part.

---

## Relations entre ces fichiers

```
utils.ts ─────────→ utilisé par PARTOUT (cn() est ubiquitous)
queryClient.tsx ──→ utilisé par layout.tsx
productBrowse.ts ──→ utilisé par page.tsx (home), recherche, catalogue
productCategories.ts ──→ utilisé par useApi.useCategories + formulaires produit
shopErrors.ts ──→ utilisé par useMyStore et les flux conditionnels
```
