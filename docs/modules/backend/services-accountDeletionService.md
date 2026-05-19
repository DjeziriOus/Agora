# Module : `backend/services/accountDeletionService.js`

## 1. Objectifs du module

Gérer la **suppression de compte utilisateur** :
- Vérifier s'il y a des commandes en cours qui bloquent la suppression.
- Nettoyer les données associées (panier, adresses, boutique, produits) après la suppression du user.

Ce module n'est **PAS** appelé directement par une route HTTP : il est utilisé par les **hooks Better Auth** dans `auth.js` et par la route `POST /api/account/delete-check`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/Cart.js`, `../models/ClientAddress.js`, `../models/Order.js`, `../models/Product.js`, `../models/Shop.js`, `../models/Variant.js`

### Modules qui utilisent ce module

- `backend/auth.js` — hook `user.deleteUser.beforeDelete` → appelle `cleanupDeletedUserData` ; appelle aussi `getAccountDeletionBlockReason`
- `backend/routes/authRoutes.js` — route `/delete-check` appelle `getAccountDeletionBlockReason`
- `backend/routes/accountDeletionRoutes.js` — fichier legacy non monté

## 3. Définitions de types / attributs

### Constante interne

```js
const BLOCKING_ORDER_STATUSES = [
  "en_attente",
  "en_preparation",
  "en_livraison",
];
```

→ Une commande dans un de ces statuts bloque la suppression du compte.

### Format renvoyé par `getAccountDeletionBlockReason`

```ts
null   // si tout est OK, la suppression peut continuer
| {
  code: "PENDING_SELLER_ORDERS" | "PENDING_CLIENT_ORDERS",
  message: string  // en français, prêt à afficher
}
```

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `getAccountDeletionBlockReason` | `({ userId, role }) => Promise<null \| { code, message }>` | Vérifie si la suppression est bloquée |
| `cleanupDeletedUserData` | `({ userId, role }) => Promise<void>` | Nettoie les données associées au user supprimé |

## 5. Variables externes

Aucune (que des fonctions).

## 6. Notes d'implémentation

### Distinction acheteur / vendeur

```js
if (role === "seller") {
  // Cherche les sous-commandes dont le sellerId est ce user
  Order.exists({
    subOrders: {
      $elemMatch: {
        sellerId: userId,
        status: { $in: BLOCKING_ORDER_STATUSES },
      },
    },
  })
} else {
  // Cherche les commandes dont l'acheteur est ce user
  Order.exists({
    userId,
    subOrders: {
      $elemMatch: {
        status: { $in: BLOCKING_ORDER_STATUSES },
      },
    },
  })
}
```

- Un **vendeur** ne peut pas se supprimer s'il a une sous-commande à traiter (un client attend sa livraison).
- Un **acheteur** ne peut pas se supprimer s'il a une commande en cours (sinon ses livraisons partent dans le vide).

### `Order.exists()` est performant

`.exists()` retourne dès qu'un document matchant est trouvé, sans charger les données. Idéal pour un check booléen.

### `cleanupDeletedUserData` — soft delete pour les vendeurs

```js
// Pour TOUS les users (buyer ou seller) :
await Promise.all([
  Cart.findOneAndDelete({ userId }),
  ClientAddress.deleteMany({ user: userId }),
]);

// Pour les sellers en plus :
if (role === "seller") {
  const shop = await Shop.findOne({ owner: userId, isDeleted: false });
  if (!shop) return;

  shop.isDeleted = true;
  shop.status = "inactive";
  await shop.save();

  await Product.updateMany({ shop: shop._id }, { isDeleted: true, isActive: false });
  await Variant.updateMany({ product: { $in: productIds } }, { isActive: false });
}
```

- Cart et ClientAddress → **delete réel** (pas utiles à conserver).
- Shop, Product, Variant → **soft delete** (`isDeleted: true`) pour préserver les références dans les anciennes commandes.

### Hook order matters

Dans `auth.js`, le hook `beforeDelete` appelle d'abord `getAccountDeletionBlockReason` (et lance une erreur si bloquant), PUIS `cleanupDeletedUserData`. Better Auth lui-même supprime ensuite le user de la collection `user` (et ses sessions / accounts associés).

### Si la suppression Better Auth plante après `cleanupDeletedUserData`

Théoriquement possible mais peu probable : on aurait un user dont le cart est supprimé mais qui existe encore. Pas critique : le user peut retenter la suppression, ou bien l'admin DB peut nettoyer manuellement.

Pour vraiment être robuste : encapsuler dans une transaction MongoDB (mais ça demande un replica set).

### Champ `userId` vs `user`

⚠️ Inconsistance historique : certaines collections utilisent `userId` (Cart, Order), d'autres utilisent `user` (ClientAddress). C'est à harmoniser un jour, mais le service gère les deux explicitement.
