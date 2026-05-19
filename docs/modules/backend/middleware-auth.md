# Module : `backend/middleware/auth.js`

## 1. Objectifs du module

Ce module fournit les **middlewares d'authentification et d'autorisation** appliqués sur les routes Express qui nécessitent un user connecté ou un rôle spécifique.

C'est le **gardien d'accès** des routes du backend.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../auth.js` — instance Better Auth (pour `auth.api.getSession`)
- `better-auth/node` — utilitaire `fromNodeHeaders` qui convertit les headers Node en `Headers` standard

### Modules qui utilisent ce module

Tous les fichiers de routes l'utilisent :
- `backend/routes/cartRoutes.js` — `verifyToken + isBuyer` sur toutes les routes
- `backend/routes/clientAddressRoutes.js` — `verifyToken + isBuyer`
- `backend/routes/orderRoutes.js` — selon la route : `isBuyer` ou `isSeller`
- `backend/routes/productRoutes.js` — `verifyToken + isSeller` sur les routes de modification
- `backend/routes/shopRoutes.js` — `verifyToken + isSeller`
- `backend/routes/authRoutes.js` — `verifyToken` (pour `/me`, `/profile-picture`, etc.)

## 3. Définitions de types / attributs

### `req.user` ajouté par `verifyToken`

Après `verifyToken`, les middlewares suivants peuvent lire :

```ts
req.user = {
  id: string;            // ID Better Auth
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "buyer" | "seller" | "unassigned" | "admin";
  emailVerified: boolean;
  image?: string;
  // ... autres champs custom du modèle user
}
```

## 4. Procédures externes

| Middleware | Signature | Rôle | Statut HTTP en cas d'échec |
|------------|-----------|------|----------------------------|
| `verifyToken` | `(req, res, next)` | Lit le cookie de session via Better Auth, attache `req.user` | 401 si pas de session |
| `requireVerifiedEmail` | `(req, res, next)` | Bloque si `req.user.emailVerified === false` | 403 |
| `isSeller` | `(req, res, next)` | Bloque si `req.user.role !== "seller"` | 403 |
| `isBuyer` | `(req, res, next)` | Bloque si `req.user.role !== "buyer"` | 403 |
| `isAdmin` | `(req, res, next)` | Bloque si `req.user.role !== "admin"` | 403 (réservé, non utilisé) |

### Ordre d'utilisation impératif

Les middlewares de rôle (`isSeller`, `isBuyer`, `requireVerifiedEmail`) **doivent toujours être placés APRÈS `verifyToken`**, sinon `req.user` est `undefined` et ils plantent.

```js
// ✅ Correct
router.use(verifyToken, isSeller);

// ❌ Mauvais — req.user undefined
router.use(isSeller, verifyToken);
```

## 5. Variables externes

Aucune (que des fonctions).

## 6. Notes d'implémentation

### Pourquoi `fromNodeHeaders` ?

Better Auth attend l'objet `Headers` de la spec Fetch (`new Headers()`). Express utilise les `req.headers` Node natifs (un simple objet). `fromNodeHeaders(req.headers)` fait la conversion.

### `auth.api.getSession()` peut échouer silencieusement

Si le cookie est valide mais la session a expiré (purgée de la base), `getSession()` renvoie `null` sans throw. C'est pourquoi on teste `!session || !session.user` au lieu de juste try/catch.

### Try/catch global

```js
try {
  const session = await auth.api.getSession(...);
  ...
} catch (err) {
  return res.status(401).json({ message: "Unauthorized. Invalid session." });
}
```

On attrape toute exception pour ne JAMAIS leaker une 500 sur les routes auth (un échec MongoDB pendant la validation de session pourrait sinon exposer trace + détails internes).

### Messages d'erreur en français vs anglais

`verifyToken` renvoie un message en anglais (« Unauthorized. Please log in. »), alors que `isSeller` / `isBuyer` / `requireVerifiedEmail` répondent en français. C'est une incohérence historique du projet. Le frontend traduit / formate ces messages pour l'utilisateur de toute façon.

### Pas de cache de session

Chaque requête authentifiée fait un round-trip à MongoDB pour valider la session. Pour des applis à très haut trafic, on cacherait les sessions en Redis ou en mémoire. Ici, le volume reste faible donc on ne fait pas cette optimisation.
