# Module : `backend/routes/orderRoutes.js`

## 1. Objectifs du module

Routes HTTP de **gestion des commandes**.

Ce fichier mélange routes acheteur et routes vendeur ; chaque route a son propre middleware (`isBuyer` ou `isSeller`) parce que les deux rôles ont besoin de voir / agir sur les commandes mais de façon différente.

⚠️ C'est le seul fichier de routes qui appelle directement les fonctions du service (pas via un contrôleur). C'est une asymétrie historique du projet.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `../middleware/auth.js` — `verifyToken`, `isBuyer`, `isSeller`
- `../services/orderService.js` — `createOrder`, `getClientOrders`, `getClientOrderById`, `getSellerOrders`, `getSellerOrderById`, `updateSubOrderStatus`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/orders", orderRoutes)`

## 3. Définitions de types / attributs

Voir le modèle Mongoose `Order` (`backend/models/Order.js`) et le document `05-flux-panier-commande.md`.

### Body attendu pour `POST /api/orders`

```ts
{
  items: { productId: string, variantId: string, quantity: number }[],
  deliveryAddress: {
    firstName: string,
    lastName: string,
    addressLine1?: string,  // ou `street`
    street?: string,
    city: string,
    postalCode: string,
    country?: string,       // défaut "France"
    phone?: string
  },
  paymentMethod?: string    // pas utilisé en pratique (paiement non implémenté)
}
```

### Body attendu pour `PATCH /api/orders/:id/status`

```ts
{ status: "en_attente" | "en_preparation" | "en_livraison" | "livree" | "annulee" }
```

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Auth | Rôle |
|---------|--------|------|------|
| POST | `/api/orders` | verifyToken + isBuyer | Crée une commande à partir d'un payload (items + adresse) |
| GET | `/api/orders/client` | verifyToken + isBuyer | Historique de l'acheteur |
| GET | `/api/orders/client/:id` | verifyToken + isBuyer | Détail d'une commande acheteur |
| GET | `/api/orders/seller` | verifyToken + isSeller | Liste des sous-commandes du vendeur |
| GET | `/api/orders/seller/:id` | verifyToken + isSeller | Détail d'une sous-commande |
| PATCH | `/api/orders/:id/status` | verifyToken + isSeller | Change le statut d'une sous-commande |
| GET | `/api/orders/:id` | verifyToken + isBuyer | Détail commande (alias de /client/:id) |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pourquoi pas de contrôleur séparé ?

Les autres fichiers de routes appellent un contrôleur (`shopController`, `cartController`) qui appelle un service. Ici, les routes appellent directement le service.

Ce serait plus cohérent d'extraire un `orderController.js`, mais ça n'a pas été fait. La logique HTTP (lecture du body, gestion d'erreur, statuts HTTP) est mélangée dans les handlers de routes.

À retenir si tu refactorises : c'est OK de laisser tel quel pour ne pas casser, mais sache que ce n'est pas la convention du reste du projet.

### `:id` dans `/seller/:id` désigne un **subOrderId**, pas un orderId

C'est subtil :
- `GET /api/orders/client/:id` → `:id = Order._id`
- `GET /api/orders/seller/:id` → `:id = subOrder._id` (l'ID d'une sous-commande)
- `PATCH /api/orders/:id/status` → `:id = subOrder._id` (PAS l'order entier)

Pourquoi ? Parce que côté vendeur, on ne voit jamais l'ordre entier (il pourrait contenir des sous-commandes d'autres vendeurs). Le vendeur ne manipule que des sous-commandes individuelles.

### Recalcul du statut global

Quand un vendeur passe une sous-commande à `livree`, le service recalcule le statut global de l'`Order` :
- Si toutes les sous-commandes sont `livree` → l'Order passe à `livree`.
- Si une sous-commande est `en_livraison` → l'Order passe à `en_livraison`.
- Etc.

L'acheteur peut donc avoir une commande qui passe progressivement de `en_attente` à `en_preparation` à `livree`, même si les vendeurs avancent à des rythmes différents.

### Ordre des routes (encore une fois important)

```js
router.post("/", ...)             // /api/orders
router.get("/client", ...)        // /api/orders/client     ← AVANT /:id
router.get("/client/:id", ...)    // /api/orders/client/:id
router.get("/seller", ...)        // /api/orders/seller     ← AVANT /:id
router.get("/seller/:id", ...)    // /api/orders/seller/:id
router.patch("/:id/status", ...)  // /api/orders/:id/status
router.get("/:id", ...)           // /api/orders/:id        ← APRÈS /client et /seller
```

### Validation du status

```js
const valid = ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'];
if (!valid.includes(status)) {
  return res.status(400).json({ message: 'Statut invalide' });
}
```

Validation côté route avant d'appeler le service. C'est une bonne pratique : on ne charge pas un service avec des données invalides.

### Erreurs structurées propagées au frontend

```js
catch (error) {
  const payload = { message: error.message };
  if (error.code) payload.code = error.code;
  if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
  if (error.productId) payload.productId = error.productId;
  res.status(error.statusCode || 500).json(payload);
}
```

Les erreurs de stock (`INSUFFICIENT_STOCK`, `MAX_PER_ORDER`) embarquent des champs supplémentaires que le frontend utilise pour ajuster l'UI (« il ne reste que X articles, voulez-vous quand même commander ? »).
