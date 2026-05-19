# Module : `backend/services/productService.js`

## 1. Objectifs du module

Logique métier complète des **produits** : CRUD, listing public et vendeur, gestion des variantes (en délégation à `variantService`), gestion des images Cloudinary.

C'est le service **le plus volumineux** du projet (~670 lignes), parce qu'il doit gérer :
- Le catalogue public (avec filtres, tri, pagination, prix sur variantes)
- L'inventaire vendeur (avec recherche full-text incluant SKU)
- L'enrichissement avec variantes (mode public vs seller)
- Le sanitization du stock (masquer le stock réel)
- L'upload / suppression d'images

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose` — ObjectId validation
- `../models/Product.js`, `../models/Variant.js`, `../models/Shop.js`
- `./variantService.js` — `createVariantsForProduct`, `updateVariantsForProduct`, `getVariantsByProduct`, `computeAggregatesFromArray`
- `../config/cloudinary.js` — uploadToCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary, hasCloudinaryConfig

### Modules qui utilisent ce module

- `backend/controllers/productController.js`

## 3. Définitions de types / attributs

### Format d'un produit enrichi (`enrichProductWithVariants`)

#### Mode `seller`

```ts
{
  ...productFields,
  variants: Variant[],              // documents bruts
  totalStock: number,
  displayPrice: number,             // prix min des variantes actives
  hasMultiplePrices: boolean
}
```

#### Mode `public`

```ts
{
  ...productFields,
  variants: PublicVariant[],        // stock masqué
  displayPrice: number,
  hasMultiplePrices: boolean,
  inStock: boolean,
  lowStock: boolean
  // totalStock OMIS
}
```

### Format `PublicVariant` (`toPublicVariant`)

```ts
{
  id, code, name, sku, price,
  attributes,
  isActive,
  maxPerOrder,
  maxPurchasable: min(stock, maxPerOrder),
  inStock: stock > 0,
  lowStock: stock > 0 && stock <= threshold
  // stock RAW OMIS
}
```

## 4. Procédures externes

L'export default est un objet :

| Fonction | Mode | Rôle |
|----------|------|------|
| `createProduct` | seller | Crée produit + variantes (au moins 1 image) |
| `updateProduct` | seller | Met à jour produit + variantes + images |
| `deleteProduct` | seller | Soft-delete + cleanup Cloudinary |
| `getProducts` | public | Listing catalogue (filtres, tri, pagination) |
| `getProductById` | public | Détail produit public |
| `getMyProductById` | seller | Détail produit pour édition |
| `getMyProducts` | seller | Listing vendeur (avec stock filter, isActive filter, etc.) |

Export nommé :

- `toPublicVariant` — utilisé par `shopService.js`

## 5. Variables externes

- `DEFAULT_PAGE = 1`
- `DEFAULT_LIMIT = 12`
- `MAX_LIMIT = 100`

Internes — pas exportées mais utilisées partout dans le service.

## 6. Notes d'implémentation

### `createProduct` — un produit doit avoir au moins 1 variante

Si `body.variants` est vide / absent, le service auto-crée une variante par défaut avec `code: "default"`, `name: "Standard"`, et le `body.price` / `body.stock` au niveau du produit.

Conséquence pour le frontend : on peut envoyer soit `price + stock` (cas simple), soit `variants: [...]` (cas avec déclinaisons), mais pas les deux.

### `updateProduct` — gestion des images (subtil)

Trois inputs côté frontend :
- `body.keepImages` — JSON array des publicIds à GARDER
- `files` — nouveaux fichiers à AJOUTER

Logique :

```
keepSet = parse(body.keepImages) → Set<publicId>

Pour chaque image existante :
  Si keepSet.size === 0 ET files.length === 0 :
    → garder TOUTES (aucun changement demandé)
  Sinon si keepSet.contains(publicId) :
    → garder cette image
  Sinon :
    → supprimer cette image

finalImages = imagesToKeep + nouveauxFichiersUploadés

Si finalImages.length === 0 → ERROR "Au moins une image requise"
```

Ce pattern permet au frontend de dire « je veux garder ces 2 images existantes et ajouter ces 3 nouvelles ». Sans ça, on devrait soit tout reuploader, soit avoir des routes séparées.

### `getProducts` — tri en mémoire pour les prix

```js
if (sortParam === "relevance") {
  // Tri natif en DB sur createdAt
} else {
  // Doit charger TOUS les produits, enrichir avec variantes (qui ont les prix), trier en JS, paginer
}
```

Pourquoi ? Parce que le prix d'un produit est sur ses variantes (`displayPrice = min(variantPrices)`), pas dans le document Product. MongoDB ne sait pas trier nativement sur cet attribut calculé.

**Conséquence performance** : si on a 10 000 produits et qu'on demande `?sort=price_asc&limit=12`, on charge les 10 000 produits + leurs variantes, on calcule en JS, on garde les 12 premiers. C'est lent à grande échelle. Pour optimiser : pré-calculer `displayPrice` dans le document Product et le mettre à jour à chaque modification de variante.

### Filtre prix sur les variantes

```js
const matchingProductIds = await Variant.distinct("product", {
  price: priceFilter,
  isActive: true,
});
filters._id = { $in: matchingProductIds };
```

Pour filtrer les produits dont AU MOINS UNE variante est dans la fourchette de prix, on fait :
1. Cherche les IDs de produits qui ont une variante dans la fourchette.
2. Filtre les produits sur ces IDs.

Pattern classique pour les filtres sur sous-documents / collections liées.

### Recherche full-text

La recherche `?q=...` cherche dans :
- `Product.name`
- `Product.description`
- `Variant.sku` (pour le vendeur seulement, via `buildMineFilters`)
- `Variant.name` (idem)

Toutes les recherches utilisent `RegExp` avec `escapeRegExp` pour échapper les métacaractères. **Pas vraiment full-text** (pas d'index text MongoDB), donc lent sur de gros volumes. Pour optimiser : créer un index text MongoDB.

### `assertObjectId`

```js
const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw error 400 `Invalid ${label}`;
  }
};
```

Garde-fou pour éviter qu'un client passe `?id=abc` (chaîne invalide) et déclenche une erreur Mongoose interne. Toujours valider AVANT la query.

### Fallback Cloudinary

```js
const images = hasCloudinaryConfig
  ? await Promise.all(files.map(...uploadToCloudinary(...)))
  : files.map((_, idx) => ({
      url: "https://placehold.co/1200x1200?text=Product+Image",
      publicId: `dev-placeholder-${Date.now()}-${idx}`,
    }));
```

En dev sans Cloudinary, on génère des URLs placehold.co. Le `publicId` est unique mais pas réel (pas de fichier sur Cloudinary). Si on essaie de le supprimer plus tard, Cloudinary répond 404 — silencieusement ignoré (Promise.allSettled).
