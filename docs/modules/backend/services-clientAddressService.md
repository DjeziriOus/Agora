# Module : `backend/services/clientAddressService.js`

## 1. Objectifs du module

Logique métier des **adresses de livraison** de l'acheteur : CRUD complet + recherche + opérations batch.

Particularité : il calcule pour chaque adresse des champs **normalisés** (`*Normalized`) qui servent à détecter les doublons.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/ClientAddress.js`

### Modules qui utilisent ce module

- `backend/controllers/clientAddressController.js`

## 3. Définitions de types / attributs

Voir le modèle Mongoose `ClientAddress` (`backend/models/ClientAddress.js`).

### Champs normalisés calculés à chaque création / update

```ts
recipientNameNormalized,
phoneNormalized,
addressLineNormalized,
cityNormalized,
provinceNormalized,
postalCodeNormalized,
countryNormalized
```

Tous obtenus par :

```js
function normalize(str) {
  return (str || "").toLowerCase().replace(/[-\s]/g, "");
}
```

→ minuscules, sans tirets, sans espaces.

## 4. Procédures externes

L'export est un objet :

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `createAddress` | `(data) => Promise<Address>` | Crée avec détection de doublon (409 si existe déjà) |
| `getAddressesByUser` | `(userId) => Promise<Address[]>` | Liste les adresses d'un user |
| `getAddressById` | `(id, userId) => Promise<Address \| null>` | Détail (avec scope user) |
| `updateAddress` | `(id, userId, data) => Promise<Address>` | Update avec détection de doublon |
| `deleteAddress` | `(id, userId) => Promise<Address \| null>` | Supprime |
| `setDefaultAddress` | `(userId, addressId) => Promise<Address>` | Marque comme défaut |
| `searchAddresses` | `(userId, { city, addressLabel }) => Promise<Address[]>` | Recherche filtrée |
| `batchDeleteAddresses` | `(userId, addressIds) => Promise<Result>` | Supprime plusieurs |
| `batchUpdateAddressLabel` | `(userId, addressIds, newLabel) => Promise<Result>` | Met à jour le label |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Détection de doublon

```js
const exists = await ClientAddress.findOne({
  user: data.user,
  ...normalized
});
if (exists) {
  const error = new Error('Address already exists ...');
  error.status = 409;
  throw error;
}
```

Si TOUS les champs `*Normalized` matchent une adresse existante, c'est un doublon. Ça permet à un user d'avoir « 123 rue de la Paix » et « 124 rue de la Paix » (différents) mais pas « 123 rue de la Paix » et « 123 RUE-DE-LA-PAIX » (considérés identiques).

### `setDefaultAddress` — en deux temps

```js
// 1. Désactive tous les défauts du user
await ClientAddress.updateMany({ user: userId }, { isDefault: false });

// 2. Active le nouveau défaut
return await ClientAddress.findOneAndUpdate(
  { _id: addressId, user: userId },
  { isDefault: true },
  { new: true }
);
```

Pas atomique mais OK en pratique. Si on voulait être strict, utiliser une transaction MongoDB.

### `error.status` vs `error.statusCode`

⚠️ Ce service utilise `error.status` (ex. `error.status = 409`), alors que les autres services utilisent `error.statusCode`. Le contrôleur `clientAddressController` gère cette spécificité :

```js
if (err.status === 409) res.status(409).json({ error: err.message });
else res.status(400).json({ error: err.message });
```

À harmoniser un jour.

### Export style différent

Comme `clientAddressController`, ce service utilise un export default avec un objet de méthodes, plutôt que des exports nommés. Style alternatif, fonctionnellement équivalent.

### Pas de validation explicite des champs

Le service ne vérifie pas que les champs obligatoires sont présents avant d'écrire en base. Il compte sur les validators Mongoose du schéma `ClientAddress` (`required: true`) pour rejeter les payloads invalides.
