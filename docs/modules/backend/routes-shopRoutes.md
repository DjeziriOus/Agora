# Module : `backend/routes/shopRoutes.js`

## 1. Objectifs du module

Définir les routes HTTP de **gestion des boutiques**.

Combine :
- Routes vendeur (création / modification de SA boutique, stats).
- Routes publiques (consultation d'une boutique par slug, ses produits).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `../controllers/shopController.js` — handlers HTTP
- `../middleware/auth.js` — `verifyToken`, `isSeller`
- `../middleware/upload.js` — `uploadShopImages`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/shops", shopRoutes)`

## 3. Définitions de types / attributs

Voir le modèle Mongoose `Shop` (`backend/models/Shop.js`).

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Auth | Rôle |
|---------|--------|------|------|
| POST | `/api/shops` | verifyToken + isSeller + uploadShopImages | Crée une boutique |
| PUT | `/api/shops/:id` | verifyToken + isSeller + uploadShopImages | Modifie une boutique |
| GET | `/api/shops/my` | verifyToken + isSeller | Récupère la boutique du vendeur connecté |
| GET | `/api/shops/my/stats` | verifyToken + isSeller | Statistiques CA, commandes |
| GET | `/api/shops/my/stock-stats` | verifyToken + isSeller | Statistiques stock |
| GET | `/api/shops/:slug/products` | publique | Liste paginée des produits d'une boutique |
| GET | `/api/shops/:slug` | publique | Détail d'une boutique par son slug |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Ordre des routes — IMPORTANT

```js
router.get("/my", ...)                  // ↑
router.get("/my/stats", ...)            // ↑ AVANT
router.get("/my/stock-stats", ...)      // ↑

router.get("/:slug/products", ...)      // ↓
router.get("/:slug", ...)               // ↓ APRÈS
```

Si on inversait l'ordre, Express matcherait `/my` comme `:slug = "my"` et appellerait le handler public au lieu du handler vendeur. **Toujours mettre les routes statiques avant les routes paramétrées.**

### Identification par `slug` (pas par `_id`)

Les routes publiques utilisent `:slug` (un identifiant lisible comme `"mon-shop-de-bougies"`) plutôt que l'ObjectId. Avantages :
- URLs propres et SEO-friendly.
- L'utilisateur peut deviner l'URL d'une boutique sans avoir un lien direct.

Le slug est généré automatiquement à partir du nom (`pre("validate")` dans `Shop.js`).

### `:id` vs `:slug` dans la même API

- `POST` et `PUT` utilisent `:id` (ObjectId) parce que c'est invariant : si le vendeur change le nom de sa boutique, l'ID ne change pas.
- `GET` publique utilise `:slug` pour les jolies URLs.

Cette asymétrie est volontaire mais demande de la vigilance — toujours utiliser la bonne forme côté frontend.
