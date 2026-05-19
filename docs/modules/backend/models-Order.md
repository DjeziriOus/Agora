# Module : `backend/models/Order.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `orders` — les **commandes** des acheteurs.

Une commande contient **N sous-commandes** (une par boutique concernée). Chaque sous-commande contient ses propres items, son propre statut, et son propre vendeur.

C'est l'entité la plus complexe du projet, parce qu'elle doit garder un **historique figé** (snapshots) de produits qui peuvent changer après coup.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`

### Modules qui utilisent ce module

- `backend/services/orderService.js`
- `backend/services/shopService.js` — pour les stats vendeur
- `backend/services/accountDeletionService.js` — pour vérifier les commandes en cours

## 3. Définitions de types / attributs

### Document `Order` (commande globale)

| Champ | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId (User) | acheteur |
| `status` | enum | statut global recalculé |
| `totalPrice` | number | somme des sous-totaux |
| `shippingAddress` | objet inline | snapshot de l'adresse |
| `addressId` | ObjectId (ClientAddress) | référence (optionnelle) |
| `subOrders` | `[SubOrder]` | tableau |
| `createdAt`, `updatedAt` | auto | |

### Sous-document `SubOrder`

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId (auto) | utilisé comme « ID de sous-commande » |
| `shopId` | ObjectId (Shop) | boutique |
| `shopName` | string | snapshot du nom |
| `sellerId` | ObjectId (User) | vendeur |
| `status` | enum | statut individuel |
| `total` | number | sous-total |
| `items` | `[SubOrderItem]` | articles |
| `stockRestored` | boolean | flag idempotence pour annulation |

### Sous-document `SubOrderItem`

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId (auto) | |
| `productId` | ObjectId (Product) | référence |
| `variantId` | ObjectId (Variant) | référence |
| `productName` | string | **snapshot** |
| `productImage` | string | **snapshot** URL |
| `quantity` | number | ≥ 1 |
| `unitPrice` | number | **snapshot** du prix au moment de l'achat |

### Enum des statuts

```
en_attente | en_preparation | en_livraison | livree | annulee
```

## 4. Procédures externes

- `default export` — la classe Mongoose `Order`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pourquoi des snapshots ?

Les champs `productName`, `productImage`, `unitPrice` sont stockés **en dur** dans la sous-commande. Si le vendeur :
- Change le nom du produit → la commande affiche toujours l'ancien nom.
- Change le prix → la facture historique reste correcte.
- Supprime le produit → la commande continue d'afficher quelque chose.

### `addressId` vs `shippingAddress` (deux champs ?)

Oui :
- `shippingAddress` est un **snapshot** des champs d'adresse au moment de la commande.
- `addressId` (optionnel) garde une référence vers l'adresse client originale pour cas exotiques (afficher « envoyer à mon adresse Domicile » dans l'UI).

Si l'utilisateur supprime son adresse après la commande, `shippingAddress` reste intact, `addressId` devient orphelin (mais ce n'est pas un problème — on ne dé-référence pas).

### Indexes

```js
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "subOrders.sellerId": 1, createdAt: -1 });
```

- Index 1 → historique acheteur trié par date (requête `Order.find({ userId }).sort({ createdAt: -1 })`).
- Index 2 → liste vendeur (requête `Order.find({ "subOrders.sellerId": sellerId })`).

L'index 2 est sur un **champ embedded** — MongoDB sait gérer ça mais avec des perfs un peu moins bonnes qu'un champ top-level. Pour des volumes énormes, dénormaliser en une collection séparée pour les sous-commandes serait possible.

### `_id: true` sur les sous-documents

```js
const subOrderSchema = new mongoose.Schema({...}, { _id: true });
```

On garde `_id` sur les sous-commandes parce qu'on les manipule individuellement (`PATCH /api/orders/:id/status` où `:id` est un `subOrder._id`).

### Pas de validation de cohérence

Le modèle ne vérifie pas que `totalPrice === sum(subOrders.total)`. C'est le service qui doit s'en assurer. Si quelqu'un écrit en base directement (ce qu'on ne fait jamais), il pourrait créer des incohérences.

### `stockRestored: false` par défaut

Quand on crée une sous-commande, `stockRestored: false`. Quand la sous-commande passe à `annulee` pour la première fois, le service restaure le stock et passe le flag à `true`. Ça empêche de restaurer deux fois si le vendeur clique plusieurs fois sur « Annuler » / « Réactiver ».
