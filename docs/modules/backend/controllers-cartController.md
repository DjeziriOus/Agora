# Module : `backend/controllers/cartController.js`

## 1. Objectifs du module

Handlers HTTP des routes `/api/cart/*` montées dans `cartRoutes.js`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../services/cartService.js` — toute la logique métier

### Modules qui utilisent ce module

- `backend/routes/cartRoutes.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Route | Rôle |
|----------|-------|------|
| `getMyCart` | `GET /api/cart` | Récupère le panier |
| `addToCart` | `POST /api/cart/add` | Ajoute un item |
| `updateCartItemQuantity` | `PUT /api/cart/update-quantity` | Change la quantité |
| `removeFromCart` | `DELETE /api/cart/remove` | Retire un item |
| `toggleCartItemSelected` | `PATCH /api/cart/toggle-selected` | Toggle case `selected` |
| `getCartCheckoutSummary` | `GET /api/cart/checkout-summary` | Résumé items sélectionnés |
| `clearMyCart` | `DELETE /api/cart/clear` | Vide le panier |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Erreurs propagées avec champs structurés

Tous les handlers suivent ce pattern :

```js
catch (error) {
  const payload = { message: error.message || "Internal server error." };
  if (error.code) payload.code = error.code;
  if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
  return res.status(error.statusCode || 500).json(payload);
}
```

Le frontend (`lib/api.ts` → `ApiError`) lit ces champs et adapte l'UI :
- `MAX_PER_ORDER` → toast « Tu ne peux acheter que X au max »
- `INSUFFICIENT_STOCK` → toast + sélecteur de quantité plafonné

### Validation minimale dans le contrôleur

Le contrôleur vérifie juste la présence de `productId` (et `quantity` pour update). Le reste de la validation (stock, maxPerOrder, existence du produit) est dans le service.

### Pas de wrapper try/catch async

Le projet n'utilise PAS de wrapper du genre `asyncHandler`. Chaque fonction a son try/catch explicite. Verbeux mais explicite.

### Réponses du contrôleur

Toutes les mutations renvoient `{ message: "...", cart: <nouveauPanier> }`. Le frontend remplace son state cart avec ce nouveau cart, plutôt que de re-fetcher → moins de round-trips.
