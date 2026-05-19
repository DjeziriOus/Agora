# Module : `backend/routes/productRoutes.js`

## 1. Objectifs du module

Routes HTTP de **gestion des produits** : création, édition, suppression (vendeur), et consultation (public + vendeur).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `../controllers/productController.js` — handlers
- `../middleware/auth.js` — `verifyToken`, `isSeller`
- `../middleware/upload.js` — `uploadProductImages`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/products", productRoutes)`

## 3. Définitions de types / attributs

Voir les modèles Mongoose `Product` (`backend/models/Product.js`) et `Variant` (`backend/models/Variant.js`).

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Auth | Rôle |
|---------|--------|------|------|
| GET | `/api/products` | publique | Liste paginée + filtres du catalogue public |
| POST | `/api/products` | verifyToken + isSeller + uploadProductImages | Crée un produit (≥ 1 image) |
| GET | `/api/products/mine` | verifyToken + isSeller | Inventaire du vendeur (avec filtres) |
| GET | `/api/products/mine/:id` | verifyToken + isSeller | Détail produit pour la page d'édition vendeur |
| GET | `/api/products/:id` | publique | Détail produit pour la page produit publique |
| PUT | `/api/products/:id` | verifyToken + isSeller + uploadProductImages | Modifie un produit |
| DELETE | `/api/products/:id` | verifyToken + isSeller | Soft-delete un produit |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Différence entre `/:id` et `/mine/:id`

- `GET /api/products/:id` (publique) — ne renvoie le produit QUE s'il est `isActive: true` et `isDeleted: false`. Sinon 404.
- `GET /api/products/mine/:id` (vendeur) — renvoie le produit même s'il est inactif (`isActive: false`), parce que le vendeur a besoin de pouvoir le modifier / le réactiver depuis la page d'édition.

C'est la même différence côté backend dans `productService.getProductById` (mode public) vs `getMyProductById` (mode seller).

### Ordre des routes

Comme pour `shopRoutes`, l'ordre compte :

```js
router.get("/", ...)                    // /api/products
router.post("/", ...)                   // /api/products
router.get("/mine", ...)                // ↑ AVANT /:id
router.get("/mine/:id", ...)            // ↑
router.get("/:id", ...)                 // /api/products/:id
router.put("/:id", ...)
router.delete("/:id", ...)
```

Sans cet ordre, `/api/products/mine` matcherait sur `:id = "mine"`.

### Query params utilisés par `GET /api/products`

| Param | Type | Effet |
|-------|------|-------|
| `q` ou `search` | string | Recherche full-text sur `name` et `description` |
| `category` | string | Filtre exact (insensible à la casse) sur la catégorie |
| `minPrice`, `maxPrice` | number | Filtre prix sur les variantes |
| `sort` | enum | `relevance` (défaut), `price_asc`, `price_desc`, `rating` |
| `page` | number | Numéro de page (défaut 1) |
| `limit` | number | Nb items par page (défaut 12, max 100) |

### Query params spécifiques vendeur sur `GET /api/products/mine`

Mêmes paramètres + `isActive=true|false`, `lowStock=true`.

### Pagination — toujours plafonnée

`MAX_LIMIT = 100` côté service. Un client malveillant qui demanderait `?limit=10000` ne pourrait pas vider la base d'un coup. La pagination est en `skip + limit` (suffisant pour ce volume ; pour des millions de produits, on basculerait sur cursor-based pagination).

### Upload des images en multipart

Les routes POST et PUT utilisent `uploadProductImages` (multer). Le body envoyé doit être en `multipart/form-data` :

```
images: <fichier1>
images: <fichier2>
...
name: "Nom produit"
description: "..."
category: "Mode"
variants: '[{"code":"...","name":"...","price":29.99,...}]'   // JSON STRINGIFIÉ
```

Le champ `variants` doit être parsé manuellement par le service car FormData ne supporte pas les objets imbriqués.
