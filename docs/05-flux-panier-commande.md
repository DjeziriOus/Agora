# Flux panier → commande (F2 / F3)

Ce document trace tout le parcours d'un acheteur, depuis l'ajout d'un produit au panier
jusqu'à la confirmation de commande et la notification du vendeur.

## 🎯 Vue d'ensemble

```
   1. Acheteur sur /produit/[id]
      │
      │ Click "Ajouter au panier"
      ▼
   2. POST /api/cart/add  → Cart en base mis à jour
      │
      ▼
   3. Acheteur va sur /panier
      │
      │ Vérifie ses items, peut décocher certains, change les quantités
      │
      ▼
   4. Click "Passer commande" → /checkout
      │
      │ Choix de l'adresse de livraison
      │
      ▼
   5. POST /api/orders → Order créé + stock décrémenté + emails envoyés
      │
      ▼
   6. Redirige vers /confirmation/[orderId]
      │
      ▼
   7. (en parallèle) Vendeurs reçoivent un email + voient la sous-commande dans /vendeur/commandes
```

## 🛒 Étape 1-3 : Vie du panier

### Ajout au panier

**Côté frontend** :
- L'acheteur clique sur "Ajouter au panier" sur une `ProductCard` ou sur la page produit.
- Le composant appelle `useCart().addToCart(product, quantity, variantId)`.
- Le hook utilise `cartApi.add(...)` pour parler au backend.

**Côté backend** (`cartService.addItem`) :
1. Vérifie que le produit existe et n'est pas supprimé / désactivé.
2. Résout la variante (passée explicitement, ou première variante active par défaut).
3. Vérifie que la nouvelle quantité ne dépasse pas `maxPerOrder` ni le stock disponible.
4. Soit ajoute un nouvel item, soit augmente la quantité de l'item existant.
5. Sauvegarde le panier.
6. Renvoie le panier avec stocks publics (`inStock`, `lowStock`, `maxPurchasable`) — pas les vrais stocks.

### Mise à jour de la quantité

`PUT /api/cart/update-quantity` avec `{ productId, quantity, variantId }`.
Mêmes vérifications de stock et `maxPerOrder`.

### Sélection / désélection d'item

`PATCH /api/cart/toggle-selected` avec `{ productId, variantId }`.
Toggle le booléen `selected`. Les items non-sélectionnés ne seront pas pris dans la commande au checkout.

### Suppression d'item

`DELETE /api/cart/remove` avec `{ productId, variantId }`.

### Récupération du panier

`GET /api/cart` — retourne le panier complet avec produits et variantes populés (`.populate()` Mongoose).

### Récupération du résumé checkout

`GET /api/cart/checkout-summary` — filtre uniquement les items sélectionnés et calcule le sous-total.
Utilisé sur la page `/checkout` pour afficher ce qui sera commandé.

## 💳 Étape 4-6 : Création de commande

C'est l'étape la plus critique du flux. La fonction `createOrder` dans `orderService.js` doit :

1. Vérifier la disponibilité de chaque article.
2. **Décrémenter le stock de manière atomique** (sans race condition).
3. Regrouper les articles par boutique.
4. Sauvegarder l'Order.
5. Envoyer les emails de confirmation.

### Le découpage en sous-commandes

Quand un acheteur a dans son panier :
- 2 articles de la boutique A (total 30 €)
- 1 article de la boutique B (total 50 €)

Le service crée **une seule** `Order` qui contient :
```js
{
  userId: "...",
  totalPrice: 80,
  status: "en_attente",
  subOrders: [
    {
      shopId: "...A...",
      shopName: "Boutique A",
      sellerId: "...A_owner...",
      status: "en_attente",
      total: 30,
      items: [ {item1}, {item2} ]
    },
    {
      shopId: "...B...",
      shopName: "Boutique B",
      sellerId: "...B_owner...",
      status: "en_attente",
      total: 50,
      items: [ {item3} ]
    }
  ]
}
```

**Pourquoi ?** Parce que chaque vendeur traite SA commande indépendamment : il peut préparer / expédier
sa partie au rythme de sa boutique, sans dépendre de l'autre vendeur.

### Le code en détail (orderService.createOrder)

Le pseudo-code suit cette logique :

```
   1. Pour chaque item du payload :
      - Vérifier que le produit existe
      - Vérifier que la variante existe et a un prix
      - Vérifier que quantité ≤ maxPerOrder
      - Récupérer le snapshot : nom, image, prix unitaire, shopId, shopName, sellerId

   2. Regrouper les items par shopId → map de groupes

   3. Construire le tableau subOrders à partir des groupes

   4. Calculer totalPrice = somme des totaux des sous-commandes

   5. Boucle de décrémentation atomique du stock :
      Pour chaque item :
         Variant.findOneAndUpdate(
           { _id: variantId, stock: { $gte: quantity } },   ← condition atomique
           { $inc: { stock: -quantity } },
           { new: true }
         )
         Si le résultat est null → quelqu'un d'autre a pris le stock entre temps
         → rollback tous les décréments déjà effectués
         → throw error

   6. Sauvegarde de l'Order
      Si la sauvegarde échoue → rollback du stock
      → throw error

   7. Lance dispatchOrderCreationEmails() en fire-and-forget
      → email acheteur (récap)
      → email à chaque vendeur (nouvelle commande)

   8. Retourne l'order sérialisé pour le frontend
```

### Décrémentation atomique : pourquoi c'est subtil

Si deux acheteurs essaient d'acheter le dernier exemplaire en même temps :

```
                Acheteur A                     Acheteur B
                ──────────                     ──────────
   T=0   Lit stock → 1                   Lit stock → 1
   T=1   Vérifie 1 >= 1 ✓                Vérifie 1 >= 1 ✓
   T=2   Écrit stock = 0                 Écrit stock = 0    ❌ vendu en double !
```

La solution est une opération atomique côté MongoDB :

```js
Variant.findOneAndUpdate(
  { _id: variantId, stock: { $gte: quantity } },  // condition
  { $inc: { stock: -quantity } }                  // décrément
);
```

MongoDB exécute la lecture + l'écriture en une seule opération. Si le filtre `stock >= quantity`
ne matche pas (parce que l'autre acheteur a déjà décrémenté), le retour est `null` et on sait
qu'il faut soit échouer, soit retenter.

### Rollback en cas d'erreur

Si la décrémentation d'un item échoue à mi-parcours, on doit **restaurer** les stocks des items déjà
décrémentés, sinon la base finit en état incohérent :

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

Idem si la sauvegarde de l'Order échoue (très rare en pratique, mais possible si Mongo coupe la connexion juste après les décréments).

## 📦 Étape 7 : Côté vendeur

### Récupération des commandes vendeur

`GET /api/orders/seller` — `orderService.getSellerOrders(sellerId)` :

1. Trouve tous les `Order` dont au moins une sous-commande a `sellerId === currentUser.id`.
2. Pour chaque ordre, extrait la sous-commande qui concerne ce vendeur (un Order peut concerner plusieurs vendeurs, on ne montre que la partie qui le regarde).
3. Retourne un tableau de sous-commandes sérialisées.

### Détail d'une sous-commande

`GET /api/orders/seller/:id` — `orderService.getSellerOrderById(sellerId, subOrderId)` :

1. Cherche l'Order qui contient cette sous-commande (`'subOrders._id': subOrderId`).
2. Vérifie que `subOrder.sellerId === currentUser.id` (sécurité : un vendeur ne peut pas voir les sous-commandes d'un autre).
3. Retourne la sous-commande + l'adresse de livraison + les infos de l'acheteur.

### Mise à jour du statut

`PATCH /api/orders/:id/status` — `orderService.updateSubOrderStatus(sellerId, subOrderId, status)` :

1. Vérifie que le statut est dans l'enum autorisé : `en_attente`, `en_preparation`, `en_livraison`, `livree`, `annulee`.
2. Vérifie l'ownership (le vendeur possède bien cette sous-commande).
3. **Cas spécial : passage à `annulee`** → restaure le stock de chaque item (et marque `sub.stockRestored = true` pour ne pas le refaire en cas de bascule de statut).
4. Recalcule le statut global de l'Order à partir des statuts de toutes les sous-commandes.
5. Sauvegarde.
6. Envoie un email à l'acheteur s'il y a eu changement.

#### Logique de recalcul du statut global

```js
if (allStatuses.every(s => s === 'livree'))        order.status = 'livree';
else if (allStatuses.every(s => s === 'annulee')) order.status = 'annulee';
else if (allStatuses.some(s => s === 'en_livraison')) order.status = 'en_livraison';
else if (allStatuses.some(s => s === 'en_preparation')) order.status = 'en_preparation';
// Sinon, statut reste 'en_attente'
```

## 📧 Emails envoyés

Tous les emails utilisent l'API Gmail HTTP (voir `services/emailService.js`).

| Quand | Destinataire | Template |
|-------|--------------|----------|
| Inscription | Nouveau user | `verificationEmailTemplate` |
| Demande reset password | User | `passwordResetTemplate` |
| Création de commande | Acheteur | `orderReceiptTemplate` |
| Création de commande | Chaque vendeur concerné | `sellerNewOrderTemplate` |
| Changement de statut | Acheteur | `orderStatusUpdateTemplate` |

Les emails de notification de commande sont en **fire-and-forget** : si l'envoi échoue, c'est loggué mais
ça ne plante pas la commande. Voir la fonction `sendMailQuiet` dans `emailService.js`.

## 🚨 Erreurs métier renvoyées au frontend

Le backend renvoie des erreurs structurées avec des `code` pour que le frontend puisse réagir précisément.

| Code | Sens | Champ extra |
|------|------|-------------|
| `MAX_PER_ORDER` | L'acheteur dépasse la limite par commande | `maxAllowed` (la limite) |
| `INSUFFICIENT_STOCK` | Pas assez de stock | `maxAllowed` (stock restant), `productId` |

Le frontend (toujours via `ApiError` dans `lib/api.ts`) extrait ces champs pour afficher des messages
précis : « Désolé, il ne reste que 3 articles en stock », etc.

## 💡 Points d'attention pour la maintenance

### 1. Toujours préserver les snapshots

Les sous-commandes contiennent `productName`, `productImage`, `unitPrice` comme **valeurs figées**.
Ne jamais lire ces valeurs depuis le produit actuel dans `Order` — le produit peut avoir changé
(prix, nom, image) ou avoir été supprimé.

### 2. Soft delete et historique

Quand un produit est supprimé (`isDeleted: true`), les anciennes sous-commandes contiennent toujours
sa référence et son nom. C'est volontaire — l'historique doit rester lisible.

### 3. Restoration du stock

La logique de restoration de stock en cas d'annulation utilise un flag `stockRestored` au niveau de
la sous-commande pour être **idempotente** : si le vendeur clique 3 fois sur "Annuler", le stock
n'est restauré qu'une seule fois.

### 4. Le statut `en_attente`

Ce statut a deux significations historiques :
- **Au niveau de la sous-commande** : commande créée, vendeur pas encore intervenu.
- **Au niveau de l'Order** : c'est le statut par défaut tant qu'aucun vendeur n'a bougé.

Si tous les vendeurs sont passés à au moins `en_preparation`, l'Order passe à `en_preparation`.

### 5. Différences avec les types TypeScript

⚠️ **Attention** : il y a une **incohérence connue** entre les statuts du backend (`'en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'`) et le type TypeScript `OrderStatus` côté frontend (`'en_attente', 'en_preparation', 'expedie', 'livre', 'annule'`). Voir `frontend/src/types/index.ts` ligne 146.

Cette divergence n'a pas d'impact pratique car le backend est la source de vérité, mais elle est à harmoniser à terme.

## 🔄 Tableau récapitulatif des routes panier/commande

| Route | Méthode | Auth | But |
|-------|---------|------|-----|
| `/api/cart` | GET | buyer | Récupère le panier |
| `/api/cart/add` | POST | buyer | Ajoute un item |
| `/api/cart/update-quantity` | PUT | buyer | Change la quantité |
| `/api/cart/remove` | DELETE | buyer | Retire un item |
| `/api/cart/toggle-selected` | PATCH | buyer | Coche/décoche un item |
| `/api/cart/checkout-summary` | GET | buyer | Résumé des items sélectionnés |
| `/api/cart/clear` | DELETE | buyer | Vide le panier |
| `/api/orders` | POST | buyer + email vérifié | Crée la commande |
| `/api/orders/client` | GET | buyer | Liste les commandes de l'acheteur |
| `/api/orders/client/:id` | GET | buyer | Détail d'une commande acheteur |
| `/api/orders/seller` | GET | seller | Liste les sous-commandes du vendeur |
| `/api/orders/seller/:id` | GET | seller | Détail d'une sous-commande |
| `/api/orders/:id/status` | PATCH | seller | Change le statut d'une sous-commande |
| `/api/orders/:id` | GET | buyer | Détail commande (alias de /client/:id) |
