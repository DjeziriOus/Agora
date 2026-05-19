# Module : `backend/config/db.js`

## 1. Objectifs du module

Établir la **connexion Mongoose à MongoDB** au démarrage du serveur.

C'est volontairement minimaliste : un seul export, une seule fonction.

## 2. Relations d'utilisation

### Modules utilisés par ce module (dépendances sortantes)

- `mongoose` — ORM MongoDB

### Modules qui utilisent ce module

- `backend/server.js` — appelle `connectDB()` au démarrage

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `connectDB` (export default) | `() => Promise<void>` | Connecte Mongoose à `process.env.MONGO_URI`. Si la connexion échoue, log l'erreur et `process.exit(1)`. |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `process.exit(1)` en cas d'échec

Si MongoDB n'est pas joignable au démarrage, l'application **arrête le processus immédiatement** plutôt que de démarrer un serveur cassé. C'est intentionnel : mieux vaut redémarrer (et alerter via les logs) que de servir des 500 toute la journée.

### `MONGO_URI` doit être dans `.env`

Cette fonction lit `process.env.MONGO_URI`. Si la variable n'est pas définie, Mongoose lance une erreur claire. C'est `dotenv.config()` dans `server.js` qui doit avoir été appelé AVANT.

### Pas de pool ni d'options avancées

Mongoose 9 gère le pooling tout seul. Pas besoin d'options spécifiques pour ce projet. Si plus tard on veut tuner (taille du pool, timeouts), c'est ici qu'il faut le faire :

```js
await mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
```

### Pas de fermeture explicite

On ne ferme jamais la connexion proprement (`mongoose.disconnect()`). C'est OK pour un serveur web : il vit jusqu'à ce qu'on l'arrête (Ctrl+C ou `kill`). Node ferme automatiquement la socket à la sortie.
