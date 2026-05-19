# Module : `backend/controllers/clientAddressController.js`

## 1. Objectifs du module

Handlers HTTP des routes `/api/addresses/*`.

Toutes les fonctions sont regroupées dans un seul export default (objet), pas en exports nommés. C'est différent du reste du projet.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../services/clientAddressService.js` — toute la logique métier

### Modules qui utilisent ce module

- `backend/routes/clientAddressRoutes.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

L'export est un objet `clientAddressController` avec les méthodes :

| Méthode | Route | Rôle |
|---------|-------|------|
| `createAddress` | `POST /api/addresses` | Crée une adresse |
| `getAddresses` | `GET /api/addresses` | Liste les adresses du user |
| `getAddressById` | `GET /api/addresses/:id` | Détail |
| `updateAddress` | `PUT /api/addresses/:id` | Met à jour |
| `deleteAddress` | `DELETE /api/addresses/:id` | Supprime |
| `setDefaultAddress` | `POST /api/addresses/:id/default` | Définit comme défaut |
| `searchAddresses` | `GET /api/addresses/search/advanced` | Recherche par ville/label |
| `batchDeleteAddresses` | `POST /api/addresses/batch/delete` | Suppression en masse |
| `batchUpdateAddressLabel` | `POST /api/addresses/batch/update-label` | Mise à jour de label en masse |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Convention différente du reste du projet

Le projet utilise majoritairement des **exports nommés** :

```js
export const createShop = async (req, res) => { ... };
export const updateShop = async (req, res) => { ... };
```

Mais ici, l'export est un **objet** :

```js
const clientAddressController = {
  async createAddress(req, res) { ... },
  async getAddresses(req, res) { ... },
};
export default clientAddressController;
```

Idem pour `clientAddressService`. C'est un style alternatif, fonctionnellement équivalent mais moins idiomatique JavaScript moderne.

### Erreurs simplifiées

Les erreurs sont toutes en 400 ou 409 (pour les doublons) :

```js
catch (err) {
  if (err.status === 409) res.status(409).json({ error: err.message });
  else res.status(400).json({ error: err.message });
}
```

Pas de `statusCode` (comme dans les autres contrôleurs), mais `status`. Pas de message d'erreur en français standardisé. À harmoniser un jour.

### `res.json({ error: ... })` vs `res.json({ message: ... })`

Ce contrôleur utilise `{ error: "..." }` alors que les autres utilisent `{ message: "..." }`. Côté frontend, `lib/api.ts → apiFetch` accepte les deux clés :

```ts
const m = body?.message ?? body?.error;
```

Donc ça marche, mais c'est inconsistant.

### Logs `console.log`

Plusieurs `console.log` actifs (`req.user`, `req.user.id`). Idem que les autres contrôleurs : à nettoyer.

### Pas de validation Zod ou Joi

Aucune validation explicite côté contrôleur. Le service vérifie certains champs (notamment l'unicité via normalisation), mais le payload n'est pas validé. Un client malveillant pourrait envoyer `recipientName: 123456` (nombre) et casser le `recipientName.toLowerCase()` du service.

Améliorer avec un schéma Zod serait pertinent à terme.
