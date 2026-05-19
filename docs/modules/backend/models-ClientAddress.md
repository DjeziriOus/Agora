# Module : `backend/models/ClientAddress.js`

## 1. Objectifs du module

Schéma Mongoose de la collection `clientaddresses` — les **adresses de livraison** enregistrées par les acheteurs.

Un user peut avoir plusieurs adresses, dont une seule peut être marquée par défaut.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `mongoose`

### Modules qui utilisent ce module

- `backend/services/clientAddressService.js`
- `backend/services/accountDeletionService.js` (suppression à la deletion de compte)
- `backend/models/Order.js` — `ref: "ClientAddress"` sur le champ `addressId` (optionnel)

## 3. Définitions de types / attributs

Voir `docs/03-modele-de-donnees.md` section `clientaddresses`. Champs :

| Champ | Type | Contrainte |
|-------|------|------------|
| `user` | string | id Better Auth de l'acheteur, requis |
| `recipientName` | string | requis |
| `recipientNameNormalized` | string | requis, calculé par le service |
| `phone` | string | requis |
| `phoneNormalized` | string | requis, calculé |
| `email` | string | optionnel |
| `addressLabel` | string | optionnel (« Domicile », « Bureau »…) |
| `addressLine` | string | requis (rue + numéro) |
| `addressLineNormalized` | string | requis, calculé |
| `city`, `province`, `postalCode`, `country` | string | requis |
| `*Normalized` (correspondants) | string | requis, calculés |
| `isDefault` | boolean | défaut false |
| `createdAt` | Date | défaut maintenant |

## 4. Procédures externes

- `default export` — la classe Mongoose `ClientAddress`

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pourquoi `user: String` et pas `ref: "User"` ?

Comme `Cart.userId`, l'`_id` de Better Auth est une string. On type donc directement en `String`. Pas de `populate` possible mais ce n'est pas nécessaire ici (les adresses sont toujours chargées dans le contexte d'un user déjà connu).

### Le double-stockage normalisé

C'est inhabituel : pour chaque champ d'adresse, on stocke à la fois la version originale ET une version normalisée. Pourquoi pas calculer à la volée ?

```js
// Recherche de doublon — sans stockage normalisé :
const all = await ClientAddress.find({ user });
const duplicates = all.filter(a =>
  normalize(a.recipientName) === normalize(data.recipientName) &&
  normalize(a.phone) === normalize(data.phone) &&
  // ... etc.
);
```

vs avec stockage normalisé :

```js
const duplicate = await ClientAddress.findOne({
  user,
  recipientNameNormalized: normalize(data.recipientName),
  phoneNormalized: normalize(data.phone),
  // ... etc.
});
```

La 2e version utilise les indexes MongoDB (si on en ajoute) et fait UNE requête au lieu de charger toutes les adresses du user. C'est aussi pourquoi on stocke les versions normalisées.

### Pas d'index sur les normalisés

⚠️ Le schéma ne déclare PAS d'index sur les champs `*Normalized`. Pour des users avec beaucoup d'adresses (peu probable mais possible), la recherche de doublon scannerait tout. À ajouter si besoin :

```js
ClientAddressSchema.index({
  user: 1,
  recipientNameNormalized: 1,
  phoneNormalized: 1,
  // ...
});
```

### Pas de contrainte « 1 seul défaut »

Le schéma autorise techniquement plusieurs adresses `isDefault: true` pour un même user. C'est le service (`setDefaultAddress`) qui s'assure que seul un défaut existe à la fois, en faisant `updateMany({ user }, { isDefault: false })` avant.

Si on écrivait en base directement (ce qu'on ne fait jamais), on pourrait avoir 2 adresses par défaut.

### `timestamps` absent

Le schéma utilise `createdAt` explicite (avec `default: Date.now`) mais **pas** `timestamps: true`. Donc pas d'`updatedAt` automatique. Si on veut tracker quand l'adresse a été modifiée, à ajouter.
