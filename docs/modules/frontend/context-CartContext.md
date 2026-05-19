# Module : `frontend/src/context/CartContext.tsx`

## 1. Objectifs du module

Fournit un **Context React** pour le panier — version « legacy ».

⚠️ **Note importante** : ce contexte est **conservé pour compatibilité** mais le frontend moderne utilise plutôt le hook `useCart()` de `frontend/src/hooks/useCart.ts` (basé sur React Query, plus performant et avec optimistic updates).

Ce contexte reste branché dans le layout racine et permet à de vieux composants de fonctionner sans cassure.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `react`
- `@/types` — `CartItem`, `Product`
- `@/lib/api` — `cartApi`
- `@/context/AuthContext` — `useAuth`
- `sonner` — toasts

### Modules qui utilisent ce module

- `frontend/app/layout.tsx` — `<CartProvider>` enveloppe l'app
- D'anciens composants qui utilisent `useCart()` depuis ce module

⚠️ **Confusion possible** : il existe DEUX hooks nommés `useCart` :
- Celui de `@/context/CartContext` (ce fichier)
- Celui de `@/hooks/useCart` (le moderne)

Les composants doivent importer le bon selon ce qu'ils veulent.

## 3. Définitions de types / attributs

### `CartContextType`

```ts
{
  items: CartItem[],
  isLoading: boolean,
  itemCount: number,
  subtotal: number,
  storeGroups: { storeId, storeName, items, subtotal }[],

  addToCart: (productOrId, quantity?, variantId?) => Promise<void>,
  updateQuantity: (productId, quantity, variantId?) => Promise<void>,
  removeFromCart: (productId, variantId?) => Promise<void>,
  clearCart: () => Promise<void>,
}
```

## 4. Procédures externes

| Export | Type | Rôle |
|--------|------|------|
| `CartProvider` | Component | Wrapper de l'app |
| `useCart` | Hook | À ne PAS confondre avec `@/hooks/useCart` |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Synchronisation avec `useAuth`

```ts
const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
```

Le contexte écoute l'état auth :
- Si pas authentifié → panier vide localement.
- Si authentifié → fetch via `cartApi.get()`.

Quand l'utilisateur se connecte / se déconnecte, le contexte se met à jour.

### Optimistic update simple (vs React Query)

Ce contexte fait des optimistic updates basiques : après une mutation réussie, il remplace `items` par la réponse du backend. Pas de rollback en cas d'échec (juste un toast erreur).

Le hook moderne (`@/hooks/useCart`) fait beaucoup mieux : rollback en cas d'erreur, cache partagé, etc.

### `addToCart` accepte product ou productId

```ts
addToCart: (productOrId: string | Product, quantity?, variantId?) => Promise<void>
```

Pratique pour les composants qui ont déjà l'objet `Product` complet (évite un round-trip).

### Bug typescript : `isLoading` n'est jamais dans `useState`

Le composant renvoie `isLoading` dans le context value mais ne déclare jamais `const [isLoading, setIsLoading] = useState(...)`. Donc c'est `undefined` (qui devient `false` en booléen).

C'est une dette technique qui passe TypeScript parce que le projet a `ignoreBuildErrors: true` dans `next.config.mjs`. À corriger.

### Comparaison avec `useCart` moderne

| Aspect | `CartContext` (ce fichier) | `hooks/useCart.ts` (moderne) |
|--------|----------------------------|-------------------------------|
| Cache | Local au contexte | React Query global |
| Optimistic | Basique (post-réponse) | Vrai (pendant la requête) |
| Rollback | Non | Oui |
| Invalidation | Manuelle | Automatique avec `invalidateQueries` |
| Inter-composants | Re-render tout le subtree | Re-render seulement ce qui consomme |
| Recommandé | Non (legacy) | Oui |

Pour nouveau code → utiliser `@/hooks/useCart`.
