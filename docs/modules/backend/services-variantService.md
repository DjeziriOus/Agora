# Module : `backend/services/variantService.js`

## 1. Objectifs du module

Service utilitaire pour la **collection `variants`**. Gère :
- Création en masse (`insertMany`)
- Mise à jour avec **upsert/delete-by-diff** (cf. note ci-dessous)
- Calcul des agrégats (totalStock, displayPrice, hasMultiplePrices)

Ce service ne valide PAS les variantes (validation faite par le caller) — il fait juste les opérations DB efficacement.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/Variant.js`

### Modules qui utilisent ce module

- `backend/services/productService.js` — crée et met à jour les variantes lors du CRUD produit
- `backend/services/shopService.js` — calcule les agrégats pour l'enrichissement des shops produits

## 3. Définitions de types / attributs

### Format d'une variante en entrée (`variantsArray[i]`)

```ts
{
  id?: string,                // optionnel - si présent + matche, update ; sinon create
  code: string,
  name: string,
  sku?: string,
  price: number | string,
  stock: number | string,
  maxPerOrder?: number,       // défaut 10
  attributes?: Record<string, string>,
  isActive?: boolean          // défaut true
}
```

### Format des agrégats (`computeAggregatesFromArray`)

```ts
{
  totalStock: number,         // somme stocks des variantes actives
  displayPrice: number,       // min prix des variantes actives (0 si aucune)
  hasMultiplePrices: boolean  // true si ≥ 2 prix distincts
}
```

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `createVariantsForProduct` | `(productId, variantsArray) => Promise<Variant[]>` | Crée plusieurs variantes via `insertMany` |
| `updateVariantsForProduct` | `(productId, variantsArray) => Promise<Variant[]>` | Pattern upsert+delete-by-diff (cf. note) |
| `getVariantsByProduct` | `(productId) => Promise<Variant[]>` | Liste toutes les variantes d'un produit |
| `getVariantByCode` | `(productId, code) => Promise<Variant>` | Une variante par code |
| `computeProductAggregates` | `(productId) => Promise<Aggregates>` | Charge les variantes ET calcule les agrégats |
| `computeAggregatesFromArray` | `(variants) => Aggregates` | Calcule les agrégats à partir d'un array déjà chargé (synchrone) |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pattern "upsert + delete-by-diff" dans `updateVariantsForProduct`

C'est le comportement le plus subtil du fichier. Le service reçoit un tableau de variantes (l'état souhaité) et doit synchroniser la base avec.

```
1. Charger TOUTES les variantes existantes du produit.
2. Pour chaque variante du payload :
   - Si elle a un `id` correspondant à une variante existante → UPDATE
   - Sinon → CREATE
   - Marquer son id comme "incoming"
3. Toute variante existante NON marquée → DELETE
```

C'est pratique parce que le formulaire d'édition côté frontend gère 3 cas (ajout, modif, suppression) en envoyant simplement le tableau final. **Mais attention** : si le caller oublie une variante dans le payload, elle est SUPPRIMÉE.

### `sanitizeMaxPerOrder`

Helper interne qui force `maxPerOrder` à être un entier ≥ 1. Sinon défaut 10. Évite que le client envoie `"abc"` ou des nombres négatifs.

### Filtrage sur `isActive` dans les agrégats

```js
const active = variants.filter((v) => v.isActive !== false);
```

`v.isActive !== false` plutôt que `v.isActive === true` pour traiter `undefined` comme actif (rétrocompatibilité — les anciennes variantes pourraient ne pas avoir ce champ).

### `computeAggregatesFromArray` vs `computeProductAggregates`

- `computeProductAggregates(productId)` — fait une query MongoDB pour charger les variantes, puis calcule.
- `computeAggregatesFromArray(variants)` — synchrone, attend déjà l'array en mémoire.

La 2e est utilisée massivement dans `productService.enrichProductsWithVariants` parce qu'on charge toutes les variantes en un coup pour N produits, et qu'on veut faire les calculs en JS sans re-query par produit.

### `Variant.insertMany`

`createVariantsForProduct` utilise `insertMany` au lieu de `create` individuel → une seule requête MongoDB au lieu de N. Important pour les produits avec beaucoup de déclinaisons (par exemple un vêtement avec 30 combinaisons taille × couleur).

### Pas de transactions

Toutes ces opérations ne sont PAS dans une transaction MongoDB. Si `updateVariantsForProduct` plante au milieu (par exemple après 3 updates sur 5), les 3 sont quand même commités. C'est OK pour ce projet (volume faible, conséquences limitées) mais à savoir.

Pour des opérations vraiment critiques, on ajouterait un `mongoose.startSession()` avec `withTransaction`.
