# Module : `backend/models/Variant.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `variants` — les **déclinaisons d'un produit** (taille, couleur, etc.).

Chaque produit a au moins une variante. C'est sur la variante que sont stockés le **prix** et le **stock**.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`

### Modules qui utilisent ce module

- `backend/models/Cart.js` — `ref: "Variant"` dans les items
- `backend/models/Order.js` — `ref: "Variant"` dans les sous-commandes
- `backend/services/variantService.js`, `productService.js`, `cartService.js`, `orderService.js`, `shopService.js`, `accountDeletionService.js`

## 3. Définitions de types / attributs

Voir `docs/03-modele-de-donnees.md` section `variants`. Champs :

| Champ | Type | Contrainte |
|-------|------|------------|
| `product` | ObjectId (Product) | requis, indexé |
| `code` | string | requis, unique par produit |
| `name` | string | requis (affiché : « Taille M ») |
| `sku` | string | optionnel (référence interne) |
| `price` | number | ≥ 0 |
| `stock` | number | entier ≥ 0 |
| `maxPerOrder` | number | défaut 10, ≥ 1, entier |
| `attributes` | Map(string) | clé:valeur libres (ex: `{ taille: "M", couleur: "rouge" }`) |
| `isActive` | boolean | défaut true |

## 4. Procédures externes

- `default export` — la classe Mongoose `Variant`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Index unique composite

```js
variantSchema.index({ product: 1, code: 1 }, { unique: true });
```

Deux variantes du même produit ne peuvent pas avoir le même `code`. Permet par exemple `code: "S"`, `code: "M"`, `code: "L"` pour les tailles.

⚠️ **Différent produit → même code OK** : on peut avoir une variante `code: "default"` sur le produit A et une autre `code: "default"` sur le produit B.

### `attributes` est une `Map`

```js
attributes: {
  type: Map,
  of: String,
  default: {},
}
```

Mongoose `Map` permet des clés dynamiques. Au runtime, c'est `Map` JavaScript (pas un objet plain). Conversion vers JSON :

```js
variant.attributes.set("taille", "M");  // Map API
JSON.stringify(variant);                 // → { taille: "M" } (Mongoose convertit)
```

C'est volontaire pour ne pas avoir à modifier le schéma à chaque nouvel attribut.

### `toJSON` transform → `id`

Comme pour `Product`, ajoute un champ `id` (string) en plus de `_id` à la sérialisation.

### Pas de soft delete

Une variante peut être désactivée (`isActive: false`) mais pas vraiment supprimée. Quand le produit parent est soft-deleted, toutes ses variantes passent à `isActive: false` (voir `productService.deleteProduct` et `accountDeletionService.cleanupDeletedUserData`).

Pour supprimer définitivement une variante : c'est fait lors de l'édition de produit (pattern delete-by-diff dans `variantService.updateVariantsForProduct`).

### Validation entière

```js
stock: {
  ...
  validate: {
    validator: Number.isInteger,
    message: "Variant stock must be an integer",
  },
}
```

Empêche `stock: 5.5`. Idem pour `maxPerOrder`.
