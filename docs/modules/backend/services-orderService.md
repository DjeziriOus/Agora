# Module : `backend/services/orderService.js`

## 1. Objectifs du module

Logique métier complète des **commandes**. C'est le service le plus stratégique du projet, parce qu'il gère :
- La création d'une commande (validation, décrémentation atomique du stock, création de sous-commandes par boutique, snapshots).
- Les listings côté acheteur et côté vendeur.
- Le changement de statut avec recalcul du statut global et restoration de stock en cas d'annulation.
- L'envoi d'emails (acheteur + vendeurs).

Voir aussi `docs/05-flux-panier-commande.md` pour la version explicative du flux.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/Order.js`, `../models/Product.js`, `../models/Variant.js`, `../models/User.js`
- `./emailService.js` — `sendOrderReceiptEmail`, `sendSellerNewOrderEmail`, `sendOrderStatusUpdateEmail`

### Modules qui utilisent ce module

- `backend/routes/orderRoutes.js` (pas de contrôleur intermédiaire)

## 3. Définitions de types / attributs

### Format renvoyé au client (acheteur)

`serializeOrderForClient(order)` retourne :

```ts
{
  id: string,
  status: OrderStatus,
  total: number,
  createdAt: Date,
  shippingAddress: { ... },
  paymentMethod: "card",          // figé
  shippingCost: 0,                // figé
  subOrders: [
    {
      id, orderId, status, total,
      store: { id, name },
      items: [{ id, product: {id, name, images}, quantity, priceAtPurchase }]
    }
  ]
}
```

### Format renvoyé au vendeur (liste)

`serializeSubOrderForList(order, sub)` :

```ts
{
  id: string,                     // ID de la sous-commande
  status, total,
  createdAt,
  items: [{ id, quantity }]      // minimal
}
```

### Format renvoyé au vendeur (détail)

`serializeSubOrderForDetail(order, sub)` :

```ts
{
  id, status, total, createdAt,
  items: [{ product: {name, images}, quantity, priceAtPurchase }],
  order: {
    user: { firstName, lastName, email },
    shippingAddress: { ... }
  }
}
```

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `createOrder` | `(userId, { items, deliveryAddress }) => Promise<Order>` | Crée la commande complète |
| `getClientOrders` | `(userId) => Promise<Order[]>` | Historique acheteur |
| `getClientOrderById` | `(userId, orderId) => Promise<Order \| null>` | Détail acheteur |
| `getSellerOrders` | `(sellerId) => Promise<SubOrder[]>` | Liste vendeur |
| `getSellerOrderById` | `(sellerId, subOrderId) => Promise<SubOrderDetail \| null>` | Détail vendeur |
| `updateSubOrderStatus` | `(sellerId, subOrderId, status) => Promise<SubOrder \| null>` | Change le statut |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `createOrder` — la partie la plus critique

Le flux exact :

```
1. Pour chaque item du payload, valider et snapshot :
   - Quantité entière ≥ 1
   - Product existe et n'est pas supprimé
   - Variant existe (ou auto-résolu à la première active)
   - quantity ≤ maxPerOrder
   - Snapshot : nom, image, prix unitaire au moment de l'achat

2. Regrouper les items par shopId → Map de groupes (sous-commandes)

3. Calculer totalPrice = somme des totaux

4. BOUCLE DE DÉCRÉMENTATION ATOMIQUE :
   Pour chaque item :
     Variant.findOneAndUpdate(
       { _id, stock: { $gte: quantity } },     ← filtre atomique
       { $inc: { stock: -quantity } }
     )
     Si null → quelqu'un d'autre a pris le stock entre-temps
     → ROLLBACK les décréments déjà effectués
     → throw INSUFFICIENT_STOCK

5. Créer l'Order avec les sous-commandes

6. Si la sauvegarde Order échoue → ROLLBACK le stock

7. dispatchOrderCreationEmails(order)  ← fire-and-forget

8. return serializeOrderForClient(order)
```

### Rollback du stock

```js
const decremented = [];
try {
  for (const item of itemsWithData) {
    const updated = await Variant.findOneAndUpdate(...);
    if (!updated) throw stockError(...);
    decremented.push(item);
  }
} catch (err) {
  await Promise.all(
    decremented.map((d) =>
      Variant.findByIdAndUpdate(d.variantId, { $inc: { stock: d.quantity } })
    )
  );
  throw err;
}
```

Le tableau `decremented` track ce qu'on a déjà fait. En cas d'erreur, on remet en place avec un `$inc: +quantity`. Pas de transaction MongoDB (le projet ne configure pas de replica set, donc transactions indisponibles).

### `dispatchOrderCreationEmails` — fire-and-forget

```js
dispatchOrderCreationEmails(order);  // pas de await
```

Pas d'`await` : la commande répond au client AVANT que les emails partent. Avantages :
- Réponse rapide pour l'acheteur (~ms au lieu de secondes).
- Un email qui plante ne bloque pas la commande.

Les erreurs d'envoi sont loggées dans `emailService` mais jamais propagées.

### `updateSubOrderStatus` — restoration de stock idempotente

```js
if (status === 'annulee' && !wasCancelled && !sub.stockRestored) {
  await Promise.all(
    (sub.items || []).map((item) =>
      Variant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } })
    )
  );
  sub.stockRestored = true;
}
```

Le flag `stockRestored` empêche la double-restauration. Cas concret : un vendeur clique sur "Annuler", puis sur "Réactiver" (= passe à `en_preparation`), puis à nouveau sur "Annuler". Sans le flag, on aurait restauré 2 fois → stock incorrect.

### Recalcul du statut global

```js
const allStatuses = order.subOrders.map((s) => s.status);
if (allStatuses.every((s) => s === 'livree'))     order.status = 'livree';
else if (allStatuses.every((s) => s === 'annulee')) order.status = 'annulee';
else if (allStatuses.some((s) => s === 'en_livraison')) order.status = 'en_livraison';
else if (allStatuses.some((s) => s === 'en_preparation')) order.status = 'en_preparation';
// else statut reste 'en_attente'
```

Ordre des `else if` important : on cherche le statut le plus « avancé » dans l'ordre `livree > annulee > en_livraison > en_preparation > en_attente`.

### Notification de l'acheteur

```js
if (previousStatus !== status) {
  User.findById(updatedOrder.userId)
    .select('firstName email')
    .lean()
    .then((buyer) => {
      sendOrderStatusUpdateEmail(buyer.email, { ... });
    });
}
```

Email envoyé UNIQUEMENT si le statut a vraiment changé (pas de notification redondante).

### `shortOrderId`

```js
const shortOrderId = (id) => {
  const s = String(id || '');
  return s.length > 8 ? s.slice(-8).toUpperCase() : s.toUpperCase();
};
```

Affiche les 8 derniers caractères de l'ObjectId en majuscules. Plus court et plus lisible que `5a1b3c4d5e6f7g8h9i0j` dans les emails et le suivi.
