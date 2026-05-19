# Module : `backend/models/Product.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `products` — les **produits** mis en vente.

⚠️ **Le produit ne contient PAS le prix ni le stock**. Ces valeurs sont sur les variantes (`backend/models/Variant.js`). Un produit a toujours au moins une variante.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`
- `../models/Shop.js` (side-effect import)

### Modules qui utilisent ce module

- `backend/models/Variant.js` — `ref: "Product"`
- `backend/models/Cart.js` — `ref: "Product"` dans les items
- `backend/models/Order.js` — `ref: "Product"` dans les sous-commandes
- Tous les services et contrôleurs liés aux produits, panier, commandes

## 3. Définitions de types / attributs

Voir `docs/03-modele-de-donnees.md` section `products`. Champs :

| Champ | Type | Contrainte |
|-------|------|------------|
| `name` | string | 3-100 caractères |
| `description` | string | max 1000 |
| `category` | string | requis, max 100 |
| `stockThreshold` | number | seuil "stock bas" (défaut 5) |
| `images` | `[{ url, publicId }]` | au moins 1 |
| `isActive` | boolean | défaut true |
| `isDeleted` | boolean | soft delete (défaut false) |
| `shop` | ObjectId (Shop) | requis |

### Champs calculés à la lecture (PAS stockés)

Ajoutés par `productService.enrichProductWithVariants` :
- `variants: Variant[]`
- `totalStock: number` (mode seller)
- `displayPrice: number`
- `hasMultiplePrices: boolean`
- `inStock: boolean` (mode public)
- `lowStock: boolean` (mode public)

## 4. Procédures externes

- `default export` — la classe Mongoose `Product`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Index `{ shop: 1, isDeleted: 1 }`

Le listing vendeur fait toujours `Product.find({ shop, isDeleted: false })`. Cet index accélère cette requête (très fréquente).

### `toJSON` transform → `id` au lieu de `_id`

```js
productSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    return ret;
  },
});
```

Quand on renvoie un produit en JSON (via `res.json(product)` ou `product.toJSON()`), le champ `_id` (ObjectId) est ajouté en `id` (string). Le frontend lit `product.id` partout.

⚠️ **Le `_id` reste présent** — `transform` ajoute `id` mais ne supprime pas `_id`. Le frontend doit donc tolérer les deux (et c'est ce qu'il fait, voir `lib/api.ts → mapProduct`).

### Soft delete : `isDeleted` ET `isActive`

Deux booléens distincts :
- `isDeleted: true` — produit supprimé définitivement. Disparait du catalogue et de l'inventaire vendeur (sauf pour `getMyProductById` qui le voit encore).
- `isActive: false` — produit désactivé temporairement. Disparait du catalogue public mais le vendeur le voit dans son inventaire.

`isActive` est l'équivalent d'un « mettre hors ligne » alors que `isDeleted` est l'équivalent d'un « supprimer définitivement ».

### Pas de champ `price`

Volontairement absent. Les requêtes qui filtrent par prix doivent passer par la collection `variants`.
