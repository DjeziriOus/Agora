# Module : `backend/controllers/shopController.js`

## 1. Objectifs du module

Handlers HTTP des routes `/api/shops/*` montées dans `shopRoutes.js`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../services/shopService.js` — toute la logique métier

### Modules qui utilisent ce module

- `backend/routes/shopRoutes.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Route | Rôle |
|----------|-------|------|
| `createShop` | `POST /api/shops` | Crée une boutique avec uploads optionnels |
| `updateShop` | `PUT /api/shops/:id` | Modifie une boutique |
| `getShopById` | `GET /api/shops/:slug` | Détail public (par slug) |
| `getShopProducts` | `GET /api/shops/:slug/products` | Produits d'une boutique |
| `getMyShop` | `GET /api/shops/my` | Boutique du vendeur connecté |
| `getVendorStats` | `GET /api/shops/my/stats` | Stats CA, commandes |
| `getStockStats` | `GET /api/shops/my/stock-stats` | Stats stock |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Le nommage `getShopById` est trompeur

`getShopById` lit en réalité `req.params.slug` (pas `req.params.id`). Le nom du paramètre dans la route est `slug`, mais le nom de la fonction n'a pas été corrigé. Pas un bug, juste de l'incohérence.

### Pas de validation côté contrôleur

La validation est faite par le service (qui lance `error.statusCode = 400/404/etc.`). Le contrôleur ne fait que :
1. Lire `req.user.id`, `req.body`, `req.files` et les passer au service.
2. Renvoyer la réponse.

C'est un choix de design : le service est testable indépendamment, et la même logique peut être réutilisée par d'autres consommateurs (par exemple un hook Better Auth, ou un script de migration).

### `req.files` — structure dépend du middleware

Pour `createShop` / `updateShop`, le middleware `uploadShopImages` (multer `fields`) construit :

```js
req.files = {
  logo: [{ buffer, mimetype, ... }],     // tableau, max 1
  banner: [{ buffer, mimetype, ... }],   // tableau, max 1
}
```

Le service accède donc à `files.logo?.[0]` et `files.banner?.[0]`. Le `?.` est important : si le user n'a uploadé qu'un logo, `files.banner` n'existe pas.

### Logs de debug en production

```js
console.log(req.body);  // dans createShop
console.log("req.user.id", req.user.id);  // dans getMyShop
```

Ces logs sont actifs même en production. À nettoyer un jour pour ne pas polluer les logs Railway.
