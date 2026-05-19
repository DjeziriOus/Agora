# Modèle de données — Collections MongoDB

Ce document décrit chaque collection MongoDB utilisée par l'application, avec les champs,
les relations, et les contraintes importantes.

## 🗂️ Vue d'ensemble des collections

```
   ┌──────────────┐         ┌──────────────┐
   │     user     │◄──────┬─│    shops     │
   │ (Better Auth)│       │ │              │
   └──────────────┘       │ └──────┬───────┘
          ▲               │        │
          │               │        │ owner = User._id
          │ userId        │        ▼
          │               │ ┌──────────────┐
   ┌──────┴───────┐       │ │   products   │
   │   sessions   │       │ │              │
   │ (Better Auth)│       │ └──────┬───────┘
   └──────────────┘       │        │
                          │        │ product = Product._id
   ┌──────────────┐       │        ▼
   │   accounts   │       │ ┌──────────────┐
   │ (Better Auth)│       │ │   variants   │
   └──────────────┘       │ └──────────────┘
                          │
   ┌──────────────┐       │ ┌──────────────┐
   │verifications │       │ │    carts     │
   │ (Better Auth)│       │ │              │
   └──────────────┘       │ └──────────────┘
                          │
   ┌──────────────┐       │ ┌──────────────┐
   │clientaddress │       │ │    orders    │
   │              │       │ │              │
   └──────────────┘       │ └──────────────┘
                          │
                          └──── shop.owner pointe vers user._id
```

## 📋 Collections gérées par Better Auth

Better Auth crée et gère lui-même ces 4 collections. Le projet n'écrit JAMAIS directement dedans —
toutes les modifications passent par l'API Better Auth.

### `user`

Documents utilisateurs. Champs principaux (gérés par Better Auth + champs custom Agora) :

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | string (UUID) | Identifiant Better Auth (pas un ObjectId !) |
| `email` | string | E-mail unique |
| `emailVerified` | boolean | Vrai si l'email a été vérifié |
| `name` | string | « prénom nom » (compat Better Auth) |
| `firstName` | string | Champ Agora |
| `lastName` | string | Champ Agora |
| `image` | string | URL de la photo de profil |
| `imagePublicId` | string | ID Cloudinary de la photo (pour pouvoir la supprimer) |
| `age` | number | Champ Agora |
| `gender` | string | Champ Agora |
| `role` | enum | `"unassigned" \| "buyer" \| "seller" \| "admin"` |

> **Attention** : l'`_id` d'un user est une **string** (généré par Better Auth), pas un ObjectId Mongoose.
> Les références à `User._id` dans les autres collections doivent donc être stockées en `String`
> ou en `Schema.Types.ObjectId` selon le cas — voir chaque schéma pour le détail.

Le modèle Mongoose `User` (`backend/models/User.js`) est un **miroir** de cette collection,
utilisé uniquement pour les `.populate()` (afficher le nom du vendeur, l'e-mail de l'acheteur, etc.).
Toute écriture passe par Better Auth.

### `sessions`

Sessions actives. Gérées par Better Auth. Une session = un cookie côté navigateur.

### `accounts`

Comptes liés à un utilisateur (credential pour email/mot de passe, ou Google pour OAuth).
Un même `user` peut avoir plusieurs `accounts` (par exemple, lié à Google + un mot de passe).

### `verifications`

Tokens temporaires (vérification d'email, reset de mot de passe).

---

## 📋 Collections applicatives (Mongoose)

### `shops` — Boutiques

Fichier : `backend/models/Shop.js`

Une boutique appartient à **un et un seul** vendeur. Un vendeur ne peut avoir qu'une seule boutique active.

| Champ | Type | Contrainte |
|-------|------|------------|
| `_id` | ObjectId | auto |
| `name` | string | 2-50 caractères, unique (parmi boutiques non-supprimées) |
| `slug` | string | généré auto à partir du `name`, unique |
| `description` | string | max 1000 |
| `contactEmail` | string | format email ou vide |
| `contactPhone` | string | regex téléphone ou vide |
| `contactAddress` | string | max 200 |
| `status` | enum | `"active" \| "inactive" \| "pending"` (défaut `pending`) |
| `owner` | ObjectId (User) | requis, unique (parmi boutiques non-supprimées) |
| `logo` | `{ url, publicId }` | image Cloudinary |
| `banner` | `{ url, publicId }` | image Cloudinary |
| `isDeleted` | boolean | soft delete |
| `createdAt`, `updatedAt` | Date | auto |

**Indexes partiels uniques** :
- `owner` est unique seulement parmi les boutiques avec `isDeleted: false`. Ça permet à un vendeur de re-créer une boutique après avoir supprimé l'ancienne.
- Idem pour `slug` et `name`.

**Hook pré-validation** : `name` modifié → `slug` regénéré automatiquement, avec gestion des collisions (`shop-1`, `shop-2`, etc.).

### `products` — Produits

Fichier : `backend/models/Product.js`

Un produit appartient à **une et une seule** boutique. Le produit lui-même n'a pas de `price` ni de `stock` :
ces valeurs sont sur les variantes.

| Champ | Type | Contrainte |
|-------|------|------------|
| `_id` | ObjectId | auto |
| `name` | string | 3-100 caractères |
| `description` | string | max 1000 |
| `category` | string | requis, max 100 |
| `stockThreshold` | number | seuil de "low stock", défaut 5 |
| `images` | `[{ url, publicId }]` | au moins 1 image |
| `isActive` | boolean | si false, n'apparaît plus dans le catalogue public |
| `isDeleted` | boolean | soft delete |
| `shop` | ObjectId (Shop) | requis |
| `createdAt`, `updatedAt` | Date | auto |

**Index** : `{ shop: 1, isDeleted: 1 }` pour accélérer les listings côté vendeur.

### `variants` — Variantes de produit

Fichier : `backend/models/Variant.js`

Une variante représente **une déclinaison** d'un produit. Exemple : un t-shirt a 3 variantes (taille S, M, L).
Même un produit simple (sans déclinaison) a une variante par défaut nommée `"Standard"`.

| Champ | Type | Contrainte |
|-------|------|------------|
| `_id` | ObjectId | auto |
| `product` | ObjectId (Product) | requis, indexé |
| `code` | string | requis, unique par produit |
| `name` | string | requis, affiché à l'acheteur |
| `sku` | string | référence interne (vide par défaut) |
| `price` | number | requis, ≥ 0 |
| `stock` | number | entier ≥ 0 |
| `maxPerOrder` | number | quantité max par commande, défaut 10 |
| `attributes` | Map(string) | ex: `{ taille: "M", couleur: "rouge" }` |
| `isActive` | boolean | si false, n'apparaît plus comme option |
| `createdAt`, `updatedAt` | Date | auto |

**Index** : `{ product: 1, code: 1 }` unique — empêche deux variantes avec le même code dans un même produit.

**Champs calculés** (jamais stockés, calculés à la volée par `variantService.computeAggregatesFromArray`) :
- `totalStock` — somme des stocks des variantes actives
- `displayPrice` — prix minimum parmi les variantes actives
- `hasMultiplePrices` — vrai si plusieurs prix différents

### `carts` — Paniers

Fichier : `backend/models/Cart.js`

Un panier appartient à **un et un seul** utilisateur (acheteur). Il contient des items.

| Champ | Type | Contrainte |
|-------|------|------------|
| `_id` | ObjectId | auto |
| `userId` | string | id Better Auth, unique |
| `items` | `[cartItem]` | tableau d'items |
| `createdAt`, `updatedAt` | Date | auto |

Chaque `cartItem` :

| Champ | Type | Contrainte |
|-------|------|------------|
| `productId` | ObjectId (Product) | requis |
| `variantId` | ObjectId (Variant) | requis |
| `quantity` | number | ≥ 1 |
| `selected` | boolean | true par défaut (case cochée au checkout) |
| `addedAt` | Date | auto |

> **Pourquoi `selected` ?** Au checkout, l'acheteur peut décocher des items pour ne payer qu'une partie de son panier. Les items décochés restent dans le panier après commande.

### `orders` — Commandes

Fichier : `backend/models/Order.js`

C'est la collection la plus complexe parce que **chaque commande est découpée en sous-commandes par boutique**.

#### Document `Order` (commande globale)

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | auto |
| `userId` | ObjectId (User) | l'acheteur |
| `status` | enum | statut global, calculé à partir des sous-commandes |
| `totalPrice` | number | somme des sous-totaux |
| `shippingAddress` | objet | adresse de livraison (copie figée — l'adresse client peut changer après) |
| `addressId` | ObjectId (ClientAddress) | référence (optionnelle) à l'adresse client originale |
| `subOrders` | `[subOrder]` | tableau de sous-commandes |
| `createdAt`, `updatedAt` | Date | auto |

#### Sous-document `subOrder`

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | auto (généré par Mongoose) |
| `shopId` | ObjectId (Shop) | boutique concernée |
| `shopName` | string | nom figé (snapshot) |
| `sellerId` | ObjectId (User) | vendeur |
| `status` | enum | statut de la sous-commande |
| `total` | number | sous-total de la boutique |
| `items` | `[subOrderItem]` | articles de cette boutique |
| `stockRestored` | boolean | true si on a déjà remis le stock après une annulation |

#### Statuts possibles (enum `OrderStatus`)

```
en_attente       → commande créée, en attente que le vendeur la prenne en charge
en_preparation   → le vendeur prépare la commande
en_livraison     → la commande a quitté la boutique
livree           → commande livrée (statut final)
annulee          → commande annulée (statut final)
```

**Statut global de l'`Order`** : recalculé à chaque changement de statut d'une sous-commande, selon ces règles :
- Toutes `livree` → l'Order passe à `livree`
- Toutes `annulee` → l'Order passe à `annulee`
- Au moins une `en_livraison` → `en_livraison`
- Au moins une `en_preparation` → `en_preparation`

Voir `orderService.updateSubOrderStatus` pour la logique exacte.

#### Sous-document `subOrderItem`

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | auto |
| `productId` | ObjectId (Product) | référence (peut pointer vers un produit supprimé) |
| `variantId` | ObjectId (Variant) | référence |
| `productName` | string | nom figé (snapshot) |
| `productImage` | string | URL figée (snapshot) |
| `quantity` | number | quantité commandée |
| `unitPrice` | number | prix unitaire **au moment de la commande** |

> **Pourquoi des snapshots ?** Si le vendeur change le nom ou le prix d'un produit après la commande, l'acheteur doit toujours voir les valeurs qui étaient en vigueur au moment de l'achat.

**Indexes** :
- `{ userId: 1, createdAt: -1 }` — historique acheteur trié par date
- `{ "subOrders.sellerId": 1, createdAt: -1 }` — liste vendeur triée par date

### `clientaddresses` — Adresses des acheteurs

Fichier : `backend/models/ClientAddress.js`

Un acheteur peut enregistrer plusieurs adresses de livraison. Une seule peut être marquée par défaut.

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | auto |
| `user` | string | id Better Auth de l'acheteur |
| `recipientName` | string | nom du destinataire |
| `phone` | string | téléphone |
| `email` | string | optionnel |
| `addressLabel` | string | étiquette ("Domicile", "Bureau", ...) |
| `addressLine` | string | rue + numéro |
| `city`, `province`, `postalCode`, `country` | string | composants de l'adresse |
| `*Normalized` | string | versions normalisées (minuscules, sans espaces) pour détecter les doublons |
| `isDefault` | boolean | adresse par défaut |
| `createdAt` | Date | auto |

> **Champs normalisés** : pour chaque champ d'adresse, il existe une version `*Normalized` qui sert à empêcher les doublons. Exemple : `"123 Rue de la Paix"` et `"123 rue de la Paix"` produisent le même `addressLineNormalized` et sont donc considérés comme identiques.

---

## 🔗 Relations entre collections

```
User (1) ←──────── (1) Shop                       (un vendeur a 1 boutique)
            owner

Shop (1) ←─────── (N) Product                     (une boutique a plusieurs produits)
              shop

Product (1) ←─── (N) Variant                      (un produit a plusieurs variantes)
              product

User (1) ←─────── (1) Cart                        (un acheteur a 1 panier)
            userId

Cart (1) ←───── (N) CartItem                      (un panier a plusieurs items)
              embedded

User (1) ←───── (N) ClientAddress                 (un acheteur a plusieurs adresses)
            user

User (1) ←───── (N) Order                         (un acheteur a plusieurs commandes)
            userId

Order (1) ←──── (N) SubOrder                      (une commande a plusieurs sous-commandes)
              embedded

Shop (1) ←──── (N) SubOrder                       (une boutique reçoit plusieurs sous-commandes)
              shopId (référence, pas $ref)

User-seller (1) ←─ (N) SubOrder                   (un vendeur reçoit plusieurs sous-commandes)
                  sellerId
```

## 🗑️ Soft delete et suppression de compte

Plusieurs entités utilisent un **soft delete** (`isDeleted: true`) plutôt qu'une suppression réelle :

- `Shop` — quand un vendeur supprime sa boutique
- `Product` — quand un vendeur supprime un produit
- `Variant` — désactivées (`isActive: false`) si le produit parent est supprimé

**Pourquoi soft delete ?** Pour préserver l'historique des commandes : si on supprimait physiquement un produit acheté, on ne pourrait plus afficher son nom et son image dans les anciennes commandes.

**Suppression de compte utilisateur** (`backend/services/accountDeletionService.js`) :
1. Avant la suppression, on vérifie qu'il n'y a pas de commande en cours (statut `en_attente`, `en_preparation` ou `en_livraison`).
2. Si l'utilisateur est vendeur, sa boutique passe en `isDeleted: true` et tous ses produits aussi.
3. Le panier et les adresses sont supprimés réellement (delete).
4. Les anciennes commandes restent intactes (l'ID utilisateur dans `Order.userId` reste, mais ne pointe plus vers personne).
