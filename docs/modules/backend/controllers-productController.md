# Module : `backend/controllers/productController.js`

## 1. Objectifs du module

Handlers HTTP des routes `/api/products/*` montées dans `productRoutes.js`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../services/productService.js` — toute la logique métier

### Modules qui utilisent ce module

- `backend/routes/productRoutes.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Route | Rôle |
|----------|-------|------|
| `createProduct` | `POST /api/products` | Crée un produit + variantes |
| `updateProduct` | `PUT /api/products/:id` | Modifie produit + variantes + images |
| `deleteProduct` | `DELETE /api/products/:id` | Soft-delete |
| `getProducts` | `GET /api/products` | Catalogue public paginé |
| `getProductById` | `GET /api/products/:id` | Détail public d'un produit |
| `getMyProductById` | `GET /api/products/mine/:id` | Détail vendeur (inclut inactifs) |
| `getMyProducts` | `GET /api/products/mine` | Inventaire vendeur paginé |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Distinction public / vendeur

Deux paires de fonctions pour la même logique mais avec des règles d'accès différentes :

| Vue publique | Vue vendeur |
|--------------|-------------|
| `getProductById(:id)` | `getMyProductById(:id)` |
| `getProducts(?q=...)` | `getMyProducts(?q=...)` |

Différences principales :
- La vue publique filtre sur `isActive: true` et la boutique non-supprimée.
- La vue publique **masque le stock réel** (`stock: 17` devient `inStock: true, lowStock: false, maxPurchasable: 10`).
- La vue vendeur expose `stock` et `totalStock` complets.

Voir `productService.toPublicVariant` et `productService.enrichProductWithVariants(mode)`.

### Multipart vs JSON

Pour `POST` et `PUT`, le contrôleur appelle le service avec `body: req.body, files: req.files`. Le service détermine ensuite quoi faire de `req.body.variants` (qui est une string JSON).

### Pas de validation Zod ici

Le projet n'utilise PAS Zod côté backend (seulement côté frontend pour les formulaires). Toute la validation est faite manuellement dans les services. C'est un peu verbeux mais ça marche.

### Erreurs du service

Le contrôleur prend l'erreur, lit son `statusCode` (sinon 500 par défaut), et renvoie le message :

```js
catch (error) {
  return res
    .status(error.statusCode || 500)
    .json({ message: error.message || "Internal server error." });
}
```

Les erreurs avec champs supplémentaires (`code`, `maxAllowed`) ne sont PAS systématiquement propagées dans ce contrôleur (contrairement à `cartController` qui le fait). C'est une différence à noter — si on veut des erreurs structurées sur les produits, il faut étendre ce pattern.
