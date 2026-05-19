# Module : `frontend/src/lib/api.ts`

## 1. Objectifs du module

C'est le **client HTTP centralisé** qui parle au backend. Toutes les requêtes du frontend passent par ce module.

Fait :
1. Définit la fonction de base `apiFetch<T>()` qui wrappe `fetch` avec gestion d'erreur, cookies, JSON parsing, toast d'erreur.
2. Définit `ApiError`, une classe d'erreur enrichie.
3. Mappe les types backend → types frontend (snake_case → camelCase, `_id` → `id`, masquage de stock, etc.).
4. Expose des objets d'API typés pour chaque domaine : `productsApi`, `storesApi`, `cartApi`, `ordersApi`, `addressesApi`, `vendorApi`, `categoriesApi`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `sonner` — `toast` pour afficher les erreurs
- `@/config` — `API_URL`
- `@/types` — `Cart`, `CartItem`, `Product`, `ProductImage`, `ProductQuery`, `ProductVariant`, `SellerProduct`

### Modules qui utilisent ce module

- `frontend/src/hooks/useApi.ts` — Tous les hooks React Query
- `frontend/src/hooks/useCart.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/CartContext.tsx`
- Tout le code qui fait un appel API au backend

## 3. Définitions de types / attributs

### Classe `ApiError`

```ts
class ApiError extends Error {
  status: number;           // HTTP status
  body: object | null;      // body JSON brut
  code?: string;            // ex: "MAX_PER_ORDER"
  maxAllowed?: number;      // ex: 5
  productId?: string;
}
```

### Types `Backend*` internes

Représentent le format **brut** renvoyé par le backend (avec `_id`, snake_case éventuel, etc.). Pas exportés.

### Types frontend (importés de `@/types`)

- `Product`, `SellerProduct`, `ProductImage`, `ProductVariant`
- `Cart`, `CartItem`
- `Order`, `OrderItem`, `SubOrder`

## 4. Procédures externes

### Fonction de base

| Export | Signature | Rôle |
|--------|-----------|------|
| `apiFetch<T>` | `(path, options?) => Promise<T>` | Appel HTTP générique avec credentials, JSON, gestion d'erreur |
| `ApiError` | Class | Erreur enrichie levée par `apiFetch` |

### Objets d'API

| Export | Méthodes |
|--------|----------|
| `productsApi` | `getAll`, `getById`, `getMineById`, `getMine`, `create`, `update`, `updateStock`, `delete`, `toggleActive` |
| `storesApi` (alias `shopsApi`) | `getById`, `getProducts`, `getMyStore`, `create`, `update` |
| `categoriesApi` | `getAll` (route n'existe pas backend → utilisée mais retourne 404) |
| `cartApi` | `get`, `add`, `updateQuantity`, `remove`, `toggleSelected`, `getCheckoutSummary`, `clear` |
| `ordersApi` | `getAll`, `getById`, `getClientOrders`, `getSellerOrders`, `getSellerOrderById`, `updateStatus`, `create` |
| `addressesApi` | `getAll`, `create`, `update`, `delete`, `setDefault` |
| `vendorApi` | `getStats`, `getStockStats` |

## 5. Variables externes

`BASE_URL = API_URL` (réexporté de `@/config`).

## 6. Notes d'implémentation

### `credentials: "include"` — CRITIQUE

```ts
const res = await fetch(`${BASE_URL}${path}`, {
  ...options,
  credentials: "include",
  // ...
});
```

Sans ça, le navigateur n'envoie PAS les cookies. → toutes les requêtes auth retournent 401.

### Header `ngrok-skip-browser-warning`

```ts
"ngrok-skip-browser-warning": "true",
```

Hack pour quand on utilise un tunnel ngrok en dev (ngrok affiche normalement une page d'avertissement HTML qui casse les requêtes JSON). À retirer si on n'utilise plus ngrok.

### Gestion d'erreur centralisée

```ts
if (!res.ok) {
  let message = `HTTP ${res.status}`;
  let body = null;
  try {
    body = await res.json();
    const m = body?.message ?? body?.error;
    if (typeof m === "string") message = m;
  } catch { /* non-JSON */ }
  toast.error(message);
  throw new ApiError(res.status, message, body);
}
```

- Toujours essayer de parser le body en JSON pour extraire `message` ou `error`.
- Afficher un toast erreur automatiquement (commodité — l'appelant n'a pas à le faire).
- Lever une `ApiError` avec le body complet pour que l'appelant puisse réagir spécifiquement.

⚠️ **Effet de bord** : si une route renvoie une erreur attendue (par exemple « adresse déjà existante »), un toast s'affiche AUTOMATIQUEMENT. Si on veut désactiver ce comportement pour une route, il faut utiliser `fetch` directement (ce que fait `AuthContext` pour `/api/auth/config`).

### `mapProduct` — la fonction de transformation cruciale

```ts
const mapProduct = (product: BackendProduct): Product => {
  // ... extrait l'id depuis _id ou id
  // ... extrait storeId, storeName, storeSlug, storeLogo depuis product.shop (qui peut être un objet ou un string)
  // ... map les variants
  // ... calcule des fallbacks pour displayPrice, hasMultiplePrices, inStock, lowStock
  return { id, name, description, ..., variants, displayPrice, ... };
};
```

C'est lourd mais nécessaire parce que le backend renvoie des structures variables (objet populé vs string id) et que les types Frontend sont plus stricts.

### `mapCart` — calcule les `storeGroups`

```ts
const storeGroups = items.reduce((groups, item) => {
  const existingGroup = groups.find(g => g.storeId === item.product.storeId);
  if (existingGroup) {
    existingGroup.items.push(item);
    existingGroup.subtotal += item.unitPrice * item.quantity;
  } else {
    groups.push({ storeId, storeName, items: [item], subtotal: item.unitPrice * item.quantity });
  }
  return groups;
}, []);
```

Le backend ne renvoie pas les items groupés par boutique. Le client fait le regroupement pour permettre à l'UI du panier d'afficher « Articles de Boutique A » + « Articles de Boutique B ».

### Pas de retry global

`apiFetch` ne retente jamais une requête échouée. Le retry (s'il y en a) est géré par React Query (option `retry`).

### Pas de batching de requêtes

Chaque appel est indépendant. Pour des écrans qui font beaucoup de requêtes (dashboard vendeur), React Query parallélise mais c'est tout. On ne fait pas de DataLoader-style batching.

### `mapCartItem` — résolution de la variante

Cas tordu : si `item.variantId` est une string (pas peuplée), on fallback sur la première variante du produit. Cas peu fréquent mais qui peut arriver si le backend renvoie des données partielles.
