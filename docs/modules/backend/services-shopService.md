# Module : `backend/services/shopService.js`

## 1. Objectifs du module

Logique métier complète des **boutiques** : création, modification, lecture publique/privée, statistiques.

C'est l'un des services les plus complexes parce qu'il croise plusieurs collections (Shop, Product, Variant, Order) pour produire les statistiques vendeur.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose` — pour `mongoose.Types.ObjectId.isValid`
- `../models/Shop.js`, `../models/Product.js`, `../models/Variant.js`, `../models/Order.js`
- `../config/cloudinary.js` — `uploadToCloudinary`, `deleteFromCloudinary`
- `./variantService.js` — `computeAggregatesFromArray`
- `../auth.js` — `requireEmailVerification`

### Modules qui utilisent ce module

- `backend/controllers/shopController.js`

## 3. Définitions de types / attributs

### Format public d'un shop (`serializePublicShop`)

```ts
{
  ...shopFields,            // tous les champs du Shop
  productCount: number      // calculé : nombre de produits actifs
}
```

### Format des statistiques vendeur

```ts
{
  totalRevenue: number,
  revenueChange: number,    // toujours 0 actuellement (pas calculé sur période)
  totalOrders: number,
  pendingOrders: number,
  totalProducts: number,
  activeProducts: number,
  averageRating: number     // toujours 0 actuellement
}
```

## 4. Procédures externes

L'export est l'objet default :

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `createShop` | `({ ownerId, emailVerified, name, ..., files }) => Promise<Shop>` | Crée une boutique |
| `updateShop` | `({ shopId, ownerId, updateData, files }) => Promise<Shop>` | Met à jour avec gestion logo/banner |
| `getShopBySlug` | `(slug: string) => Promise<Shop>` | Lecture publique par slug |
| `getShopProductsBySlug` | `(slug, query) => Promise<{products, total, page, limit}>` | Produits paginés d'un shop |
| `getMyShop` | `(ownerId) => Promise<Shop \| null>` | Boutique du vendeur (null si pas créé) |
| `getVendorStats` | `(ownerId) => Promise<Stats>` | Statistiques globales |
| `getStockStats` | `(ownerId) => Promise<StockStats>` | inStock / lowStock / outOfStock counts |

## 5. Variables externes

Aucune (l'export est l'objet de fonctions).

## 6. Notes d'implémentation

### `createShop` — validations en chaîne

```
1. Si REQUIRE_EMAIL_VERIFICATION + email non vérifié → 403
2. Si vendeur a déjà une boutique → 409
3. Si nom déjà pris (par une autre boutique active) → 409
4. Upload logo et banner sur Cloudinary
5. Création du document Shop (qui régénère le slug auto)
6. Si erreur unicité en base (code 11000) → 409 propre
```

L'étape 3 utilise une **collation `{ locale: "en", strength: 2 }`** pour comparer les noms de façon case-insensitive. Donc `"Ma Boutique"` et `"ma boutique"` sont détectés comme le même nom.

### `updateShop` — ownership check

```js
if (shop.owner.toString() !== ownerId.toString()) {
  throw error 403 "Access denied. You do not own this shop.";
}
```

Vérification de propriété avant toute modification. **Sans ça**, un vendeur pourrait passer l'ID d'une autre boutique et la modifier. Sécurité critique.

### Remplacement d'image

Helper `replaceShopImage(file, existing, preset)` :
- Si pas de nouveau fichier → renvoie `null` (pas de changement).
- Sinon : upload + supprime l'ancienne image (fire-and-forget).

### `enrichProductsWithVariants` — code dupliqué

⚠️ Cette fonction est dupliquée dans `productService.js`. C'est le même code. À refactoriser dans un fichier `productEnrichment.js` partagé.

### `getVendorStats` — performance

```js
const orders = await Order.find({ "subOrders.sellerId": ownerId }).lean();
let totalRevenue = 0;
for (const order of orders) { ... }
```

On charge **tous les Orders qui concernent ce vendeur** et on agrège en JavaScript. Pour des volumes faibles c'est OK, mais pour des milliers de commandes ce serait lent. Optimisation possible : utiliser `Order.aggregate` côté MongoDB.

### `getStockStats` — par variante, pas par produit

Le compteur de stock se fait sur les variantes (pas les produits). Un produit avec 3 variantes en stock + 1 en rupture compte comme :
- `inStockCount: 3`
- `outOfStockCount: 1`

Pour la conception du dashboard, cette granularité est correcte (le vendeur veut savoir combien de SKUs sont en rupture).

### Si tu refactorises

Le fichier mélange :
- Logique de validation (ex. unicité du nom).
- Logique d'agrégation (ex. enrichment avec variantes).
- Logique de stats.
- Helpers d'upload Cloudinary.

À découper en plusieurs services plus petits si le code grossit (ex. `shopStatsService.js`, `shopImageService.js`).
