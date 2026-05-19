# Module : `backend/models/User.js`

## 1. Objectifs du module

Modèle Mongoose **miroir** de la collection `user` (qui est en réalité gérée par Better Auth).

Ce modèle **n'écrit jamais** dans la collection — toutes les écritures passent par Better Auth.
Il est utilisé uniquement pour les `.populate()` Mongoose (afficher le vendeur d'un produit, l'acheteur d'une commande, etc.).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`

### Modules qui utilisent ce module

- `backend/models/Shop.js` — `ref: "User"` pour le champ `owner`
- `backend/models/Order.js` — `ref: "User"` pour `userId` et `subOrders.sellerId`
- `backend/services/authService.js` — `User.findById` pour lire le profil
- `backend/services/orderService.js` — `User.findById` pour récupérer email vendeur/acheteur (notifications)
- `backend/controllers/authController.js` — lecture de `imagePublicId` avant remplacement

## 3. Définitions de types / attributs

Voir `docs/03-modele-de-donnees.md` section `user`. Champs :

| Champ | Type | Défaut |
|-------|------|--------|
| `_id` | string (UUID Better Auth) | auto |
| `email` | string | — |
| `emailVerified` | boolean | false |
| `firstName`, `lastName` | string | `""` |
| `name` | string | `""` |
| `image` | string | `""` |
| `imagePublicId` | string | `""` |
| `age` | number | null |
| `gender` | string | `""` |
| `role` | enum | `"unassigned"` |
| `createdAt`, `updatedAt` | Date | auto |

## 4. Procédures externes

- `default export` — la classe Mongoose `User` standard

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `collection: "user"` est CRITIQUE

```js
{
  timestamps: true,
  collection: "user",  // ← OBLIGATOIRE
}
```

Par défaut, Mongoose pluraliserait le nom du modèle → `users`. Mais Better Auth utilise `user` (singulier). Sans l'option `collection`, on aurait deux collections distinctes et l'auth serait cassée.

Le nom de la collection est aligné avec `auth.js → collectionNames.user`.

### `_id` est une string, pas un ObjectId

Better Auth génère ses propres IDs (UUIDs). Les autres modèles qui référencent un user via `ref: "User"` doivent donc être vigilants quand ils valident des IDs en input. Voir `Shop.owner`, `Order.userId`, etc.

### Pas d'index unique sur email

Le schéma n'a PAS d'index unique sur `email`. C'est Better Auth qui s'occupe de ça via son propre adapter. Si on ajoutait un index ici, on aurait potentiellement un conflit (deux contraintes uniques sur la même collection).

### Champs `password` absent

Les mots de passe sont stockés dans la collection `accounts` (gérée par Better Auth), pas dans `user`. On n'a donc PAS de champ `password` à protéger ici.
