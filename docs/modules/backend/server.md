# Module : `backend/server.js`

## 1. Objectifs du module

C'est le **point d'entrée du backend**. Quand on lance `npm run dev` ou `npm start`, c'est ce fichier qui s'exécute en premier. Il :

1. Charge les variables d'environnement (`.env`).
2. Connecte la base MongoDB (via Mongoose).
3. Configure les middlewares globaux (CORS, logger, parseur JSON).
4. Monte le catch-all Better Auth pour toutes les routes `/api/auth/*`.
5. Monte les routes applicatives (`/api/shops`, `/api/products`, etc.).
6. Démarre le serveur HTTP sur le port configuré (5001 par défaut).

## 2. Relations d'utilisation

### Modules utilisés par ce module (dépendances sortantes)

- `express` — framework HTTP
- `cors` — middleware CORS
- `dotenv` — chargement des variables `.env`
- `better-auth/node` — fonction `toNodeHandler` pour mounter Better Auth dans Express
- `./config/db.js` — `connectDB()` pour Mongoose
- `./auth.js` — instance `auth` Better Auth + flag `requireEmailVerification`
- Toutes les routes `./routes/*.js` (shopRoutes, productRoutes, cartRoutes, orderRoutes, clientAddressRoutes, authRoutes)
- `./services/swagger.js` (nouveau, ajouté par cette doc) — config Swagger

### Modules qui utilisent ce module

Aucun : c'est le point d'entrée. Il est lancé directement par `node` / `nodemon`.

## 3. Définitions de types / attributs

Pas de types exportés. Crée une instance `app` Express qui est utilisée uniquement localement.

## 4. Procédures externes

Aucune fonction n'est exportée par ce module. Il a un effet de bord : démarrer le serveur.

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Ordre des middlewares — c'est CRITIQUE

L'ordre suivant doit être respecté :

```js
1. dotenv.config()           // AVANT tout le reste (auth.js a besoin de MONGO_URI)
2. app.use(cors(...))
3. app.use(loggerMiddleware)
4. app.get("/api/auth/config", ...)    // route EXPLICITE pour le flag verification
5. app.all("/api/auth/*splat", toNodeHandler(auth))   // catch-all Better Auth
6. app.use(express.json())   // SEULEMENT APRÈS Better Auth (il parse son body lui-même)
7. app.use("/api/shops", shopRoutes)
   ... etc.
```

**Pourquoi `express.json()` doit être APRÈS le catch-all Better Auth ?** Parce que Better Auth attend le body brut pour le parser lui-même. Si `express.json()` consomme déjà le body, Better Auth reçoit un body vide et plante.

### Express 5 — syntaxe `*splat`

Express 5 a changé la syntaxe des wildcards. Au lieu de `/api/auth/*`, il faut écrire `/api/auth/*splat` (où `splat` est un nom de paramètre obligatoire pour le wildcard). C'est subtil et facile à oublier.

### `trust proxy: 1`

Ligne `app.set("trust proxy", 1)` — indique à Express qu'il y a UN niveau de proxy devant (typiquement Vercel ou Railway). Sans ça, Express ne lirait pas correctement les headers `x-forwarded-host`, `x-forwarded-proto`, ce qui casserait l'auth en production.

### Le logger

Un middleware loggue chaque requête avec couleur ANSI selon le code de retour :
- Vert : 2xx
- Jaune : 4xx
- Rouge : 5xx

Pratique en dev pour repérer les erreurs visuellement. Pas activé en prod (un vrai logger genre Winston/Pino serait préférable).
