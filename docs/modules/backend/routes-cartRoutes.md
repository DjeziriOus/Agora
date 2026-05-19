# Module : `backend/routes/cartRoutes.js`

## 1. Objectifs du module

Routes HTTP du **panier** acheteur.

Toutes les routes sont protégées par `verifyToken + isBuyer` — un vendeur connecté ne peut pas avoir de panier (il n'est pas censé acheter).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `../controllers/cartController.js` — handlers : `getMyCart`, `addToCart`, `updateCartItemQuantity`, `removeFromCart`, `toggleCartItemSelected`, `getCartCheckoutSummary`, `clearMyCart`
- `../middleware/auth.js` — `verifyToken`, `isBuyer`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/cart", cartRoutes)`

## 3. Définitions de types / attributs

Voir le modèle Mongoose `Cart` (`backend/models/Cart.js`).

Format d'item retourné au frontend (après sanitization par `cartService.sanitizeCartVariant`) :

```ts
{
  productId: { ... },         // produit populé
  variantId: {
    id, code, name, sku, price,
    inStock: boolean,
    lowStock: boolean,
    maxPurchasable: number,   // min(stock, maxPerOrder)
    maxPerOrder: number,
    isActive: boolean,
    // stock RAW est masqué pour les acheteurs
  },
  quantity: number,
  selected: boolean
}
```

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Body | Rôle |
|---------|--------|------|------|
| GET | `/api/cart` | — | Récupère le panier |
| POST | `/api/cart/add` | `{ productId, quantity?, variantId? }` | Ajoute un item (ou augmente sa quantité) |
| PUT | `/api/cart/update-quantity` | `{ productId, quantity, variantId? }` | Change la quantité |
| DELETE | `/api/cart/remove` | `{ productId, variantId? }` | Retire un item |
| PATCH | `/api/cart/toggle-selected` | `{ productId, variantId? }` | Bascule la case `selected` |
| GET | `/api/cart/checkout-summary` | — | Résumé des items sélectionnés (sous-total, comptage) |
| DELETE | `/api/cart/clear` | — | Vide le panier (utilisé après commande) |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pas de panier invité

Toutes les routes nécessitent un user connecté. Conséquence : un visiteur non connecté qui essaie d'ajouter au panier reçoit 401, et le frontend redirige vers `/login`.

C'est un choix volontaire (voir `02-stack-technique.md`) qui simplifie le code : pas de logique de fusion entre panier local et panier serveur à la connexion.

### `isBuyer` plutôt que `verifyToken` seul

Les routes du panier ont `verifyToken + isBuyer`. Un vendeur connecté reçoit donc 403 sur toutes ces routes.

Côté frontend, le hook `useCart` court-circuite avant même d'appeler le backend si `isSeller` est vrai (`enabled: isAuthenticated && !isSeller` dans le query).

### `variantId` est techniquement optionnel mais en pratique requis

Si `variantId` n'est pas envoyé, le backend résout la première variante active du produit. C'est un fallback pour les boutons "Ajout rapide" sur les cartes produit (qui ne demandent pas à l'acheteur quelle variante choisir).

Sur la page produit, le frontend envoie toujours explicitement le `variantId` choisi.

### POST `add` : nouveau item ou incrément ?

`cartService.addItem` cherche si l'item existe déjà (même `productId` ET `variantId`) :
- Si oui : `quantity += quantité demandée` (mais ≤ stock et ≤ maxPerOrder).
- Si non : ajoute un nouvel item dans `items[]`.

Donc cliquer "Ajouter" deux fois sur le même produit ne crée pas deux lignes, mais incrémente la quantité.

### Toggle selected

Le champ `selected` permet à l'acheteur, sur la page panier, de cocher/décocher des items pour ne commander qu'une partie de son panier. Les items décochés restent dans le panier après commande.

`getCheckoutSummary` ne renvoie QUE les items `selected: true`.

### Erreurs structurées

Les erreurs ont parfois des champs supplémentaires :

```json
{
  "message": "La limite d'achat pour ce produit est de 5",
  "code": "MAX_PER_ORDER",
  "maxAllowed": 5
}
```

ou

```json
{
  "message": "Désolé, la quantité demandée n'est plus disponible (2 restants)",
  "code": "INSUFFICIENT_STOCK",
  "maxAllowed": 2
}
```

Le frontend (`lib/api.ts → ApiError`) les parse pour afficher des messages précis et ajuster automatiquement les sélecteurs de quantité.
