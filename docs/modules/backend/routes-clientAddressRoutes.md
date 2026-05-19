# Module : `backend/routes/clientAddressRoutes.js`

## 1. Objectifs du module

Routes HTTP de **gestion des adresses de livraison** de l'acheteur.

Permet à un acheteur d'enregistrer plusieurs adresses, d'en choisir une par défaut, et de les utiliser au moment du checkout.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `../controllers/clientAddressController.js` — handlers
- `../middleware/auth.js` — `verifyToken`, `isBuyer`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/addresses", clientAddressRoutes)`

## 3. Définitions de types / attributs

Voir le modèle Mongoose `ClientAddress` (`backend/models/ClientAddress.js`).

### Body type pour CREATE et UPDATE

```ts
{
  recipientName: string,
  phone: string,
  email?: string,
  addressLabel?: string,    // ex: "Domicile", "Bureau"
  addressLine: string,
  city: string,
  province: string,
  postalCode: string,
  country: string,
  isDefault?: boolean
}
```

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Body / Query | Rôle |
|---------|--------|--------------|------|
| POST | `/api/addresses` | body adresse complète | Crée une adresse |
| GET | `/api/addresses` | — | Liste les adresses du user |
| GET | `/api/addresses/search/advanced` | `?city=...&addressLabel=...` | Recherche filtrée |
| POST | `/api/addresses/batch/delete` | `{ addressIds: string[] }` | Suppression multiple |
| POST | `/api/addresses/batch/update-label` | `{ addressIds, newLabel }` | Met à jour le label en masse |
| POST | `/api/addresses/:id/default` | — | Marque comme adresse par défaut |
| GET | `/api/addresses/:id` | — | Détail d'une adresse |
| PUT | `/api/addresses/:id` | body adresse | Met à jour |
| DELETE | `/api/addresses/:id` | — | Supprime |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Toutes les routes sont buyer-only

`router.use(verifyToken, isBuyer)` au début du fichier protège TOUTES les routes (pas besoin de répéter les middlewares sur chaque route).

### Détection de doublons par normalisation

Le service `clientAddressService` calcule, pour chaque adresse, des champs `*Normalized` :

```js
recipientNameNormalized = recipientName.toLowerCase().replace(/[-\s]/g, "")
phoneNormalized = phone.toLowerCase().replace(/[-\s]/g, "")
addressLineNormalized = ...
// etc.
```

Ces champs servent à comparer les adresses entre elles : `"123 Rue de la Paix"` et `"123 rue de la Paix"` produisent le même `addressLineNormalized`, donc ils sont considérés comme identiques.

Si l'utilisateur essaie d'ajouter une adresse qui matche TOUS les `*Normalized` d'une adresse existante → 409 Conflict.

### Single default address

`setDefaultAddress` est implémenté en deux étapes :
1. `updateMany({ user: userId }, { isDefault: false })` — désactive tous les défauts précédents.
2. `findOneAndUpdate({ _id: addressId }, { isDefault: true })` — active le nouveau défaut.

Pas atomique en théorie, mais en pratique pas de souci (l'utilisateur ne change pas son adresse par défaut depuis plusieurs onglets en même temps).

### Routes `/batch/*` AVANT `/:id`

Comme pour les autres routes, l'ordre Express compte :

```js
router.get("/search/advanced", ...)
router.post("/batch/delete", ...)
router.post("/batch/update-label", ...)
router.post("/:id/default", ...)
router.get("/:id", ...)
router.put("/:id", ...)
router.delete("/:id", ...)
```

Sans ça, `POST /api/addresses/batch/delete` matcherait `:id = "batch"` et plantarait.

### Réponses des batch operations

`batchDeleteAddresses` et `batchUpdateAddressLabel` renvoient simplement `{ success: true }` sans détail. Si on voulait être plus informatif, on retournerait le nombre de documents affectés (`result.deletedCount`, `result.modifiedCount`). Point d'amélioration possible.
