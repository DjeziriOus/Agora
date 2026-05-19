# Module : `backend/services/cartService.js`

## 1. Objectifs du module

Logique métier complète du **panier acheteur**.

Gère : récupération (avec création auto si inexistant), ajout, mise à jour de quantité, retrait, toggle sélection, vidage, résumé checkout. Sanitize les données pour ne jamais leaker le stock réel des variantes.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/Cart.js`
- `../models/Product.js`
- `../models/Variant.js`

### Modules qui utilisent ce module

- `backend/controllers/cartController.js`

## 3. Définitions de types / attributs

### Item sanitizé renvoyé au frontend

```ts
{
  productId: PopulatedProduct,
  variantId: {                       // ← objet (sanitizé), pas un string
    id, code, name, sku, price,
    attributes, isActive,
    maxPerOrder,
    maxPurchasable: min(stock, maxPerOrder),
    inStock: stock > 0,
    lowStock: stock > 0 && stock <= threshold
    // stock RAW est SUPPRIMÉ pour les acheteurs
  },
  quantity, selected, addedAt
}
```

### Format du checkout summary

```ts
{
  selectedItems: CartItem[],   // items avec selected: true uniquement
  subtotal: number,            // somme prix × quantité
  itemCount: number            // somme des quantités
}
```

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `getCart` | `(userId) => Promise<Cart>` | Charge avec populate + sanitize. Crée un panier vide si absent. |
| `addItem` | `(userId, productId, quantity?, variantId?) => Promise<Cart>` | Ajoute ou incrémente |
| `updateQuantity` | `(userId, productId, quantity, variantId) => Promise<Cart>` | Change la quantité |
| `removeItem` | `(userId, productId, variantId) => Promise<Cart>` | Retire un item |
| `toggleSelected` | `(userId, productId, variantId) => Promise<Cart>` | Toggle case `selected` |
| `getCheckoutSummary` | `(userId) => Promise<Summary>` | Items sélectionnés + sous-total |
| `clearCart` | `(userId) => Promise<void>` | Vide le panier |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `sanitizeCartVariant` — masquage du stock

```js
return {
  ...variant,
  maxPerOrder, maxPurchasable, inStock, lowStock,
  // stock RAW intentionnellement absent
};
```

Le panier renvoyé à l'acheteur ne contient JAMAIS le champ `stock`. À la place, on calcule `maxPurchasable = min(stock, maxPerOrder)` pour que le sélecteur de quantité sache jusqu'où aller, mais sans révéler le compteur exact.

### `resolveVariant` — fallback à la première variante active

Si `variantId` n'est pas fourni dans `addItem`, le service prend la première variante active du produit (par `createdAt`). Permet aux boutons « Ajout rapide » qui n'ont pas de UI de sélection.

Sur la page produit, le frontend envoie toujours un `variantId` explicite (l'acheteur choisit sa taille / couleur).

### `addItem` — incrément ou nouvel item

```js
const existingItem = cart.items.find(
  (i) => i.productId.toString() === productId
      && i.variantId.toString() === variant._id.toString()
);

if (existingItem) {
  // Increment quantity
  existingItem.quantity = existingItem.quantity + quantity;
} else {
  // Push new item
  cart.items.push({...});
}
```

Deux items du même produit+variante sont fusionnés en un seul. Logique pour un panier propre.

### Vérifications de stock dans toutes les mutations

`addItem` et `updateQuantity` vérifient :
1. `quantity > maxPerOrder` → erreur 400 `MAX_PER_ORDER`
2. `quantity > variant.stock` → erreur 400 `INSUFFICIENT_STOCK`

Avec les champs `maxAllowed` propagés au frontend pour ajustement automatique.

### Création auto du panier

```js
if (!cart) {
  cart = await Cart.create({ userId, items: [] });
}
```

`getCart` crée le panier au premier appel. Pas de route dédiée « créer un panier » — l'acheteur a toujours un panier dès qu'il essaie d'en consulter un.

### `clearCart` — silencieux

```js
await Cart.findOneAndUpdate({ userId }, { items: [] });
```

Si le panier n'existe pas, ça ne fait rien et ne renvoie pas d'erreur. Utilisé par `orderService` après une commande réussie.

### Pas de validation côté service sur le user

Le service ne vérifie pas que `userId` correspond à un user existant — il fait confiance à `req.user.id` placé par le middleware d'auth. C'est OK parce que le middleware a déjà validé la session.
