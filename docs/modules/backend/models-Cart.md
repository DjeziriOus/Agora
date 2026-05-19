# Module : `backend/models/Cart.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `carts` — le **panier** d'un acheteur.

Un panier appartient à un et un seul user. Il contient une liste d'items (produit + variante + quantité).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`

### Modules qui utilisent ce module

- `backend/services/cartService.js`
- `backend/services/accountDeletionService.js` (suppression à la deletion de compte)

## 3. Définitions de types / attributs

### Schéma `Cart`

| Champ | Type | Contrainte |
|-------|------|------------|
| `userId` | string | id Better Auth, **unique** (1 panier max par user) |
| `items` | `[CartItem]` | tableau |
| `createdAt`, `updatedAt` | Date | auto |

### Sous-schéma `CartItem` (`_id: false`)

| Champ | Type | Contrainte |
|-------|------|------------|
| `productId` | ObjectId (Product) | requis |
| `variantId` | ObjectId (Variant) | requis |
| `selected` | boolean | défaut true |
| `addedAt` | Date | défaut maintenant |
| `quantity` | number | ≥ 1 |

## 4. Procédures externes

- `default export` — la classe Mongoose `Cart`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `userId` en string (pas ObjectId)

```js
userId: {
  type: String,
  required: true,
  unique: true,
}
```

Le `_id` de Better Auth est une string (UUID), donc on type le champ en `String`. **Important** : ne pas faire `ref: "User"` ici — `populate` ne fonctionnerait pas sur des strings.

### `unique: true`

Un user ne peut avoir qu'un seul panier. Si on essaie d'en créer un deuxième → erreur 11000.

### `_id: false` sur CartItem

```js
const cartItemSchema = new mongoose.Schema({...}, { _id: false });
```

Pas de sous-document avec son propre `_id`. Les items sont identifiés par la combinaison `(productId, variantId)`. C'est suffisant parce qu'on peut pas avoir deux items identiques dans le même panier (le service fusionne en incrément).

### `selected: true` par défaut

Tout nouvel item est sélectionné par défaut → il sera dans la commande au checkout. L'acheteur peut décocher manuellement.

### Pas de validation de stock côté modèle

Le modèle accepte n'importe quelle quantité (≥ 1). C'est le service qui vérifie `quantity ≤ stock` et `quantity ≤ maxPerOrder` avant d'écrire.

### Pas d'index sur les items

Les items sont un sous-document. On ne fait JAMAIS de query du genre `Cart.findOne({ "items.productId": ... })` parce que le panier complet est toujours chargé d'un coup. Pas besoin d'index.
