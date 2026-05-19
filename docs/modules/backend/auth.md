# Module : `backend/auth.js`

## 1. Objectifs du module

Ce module **configure et exporte l'instance Better Auth** utilisée partout dans l'application.

C'est lui qui définit :
- Comment se connecter à MongoDB pour les collections d'auth (user, sessions, accounts, verifications).
- Le provider email/mot de passe.
- Le provider OAuth Google.
- Les champs custom du document `user` (firstName, lastName, role, image, etc.).
- Les hooks qui se déclenchent à l'inscription / suppression d'un user.
- La politique de vérification d'email.
- La configuration des cookies (`SameSite`, `Secure`).
- L'URL de base pour les redirections.

## 2. Relations d'utilisation

### Modules utilisés par ce module (dépendances sortantes)

- `better-auth` — bibliothèque d'auth
- `better-auth/api` — pour le type `APIError`
- `better-auth/adapters/mongodb` — adaptateur MongoDB pour Better Auth
- `mongodb` — driver natif (séparé de Mongoose)
- `./services/emailService.js` — pour `sendVerificationEmail`, `sendPasswordResetEmail`
- `./services/accountDeletionService.js` — pour `cleanupDeletedUserData`, `getAccountDeletionBlockReason`

### Modules qui utilisent ce module

- `backend/server.js` — importe `auth` et `requireEmailVerification`
- `backend/middleware/auth.js` — utilise `auth.api.getSession()` pour vérifier les tokens
- `backend/controllers/authController.js` — utilise `auth.api.updateUser()` pour le profil
- `backend/routes/authRoutes.js` — utilise `auth.api.listUserAccounts`, `auth.api.verifyPassword`
- `backend/services/shopService.js` — utilise `requireEmailVerification` pour bloquer la création de boutique

## 3. Définitions de types / attributs

### Configuration Better Auth (objet `auth`)

```js
{
  baseURL: string | { allowedHosts, fallback, protocol },
  database: MongoAdapter,
  emailAndPassword: { enabled, sendResetPassword },
  emailVerification: { sendOnSignUp, autoSignInAfterVerification, sendVerificationEmail },
  socialProviders: { google: { clientId, clientSecret, redirectURI, mapProfileToUser } },
  user: { changeEmail, deleteUser, additionalFields },
  trustedOrigins: string[],
  hooks: { before },
  databaseHooks: { user: { create: { before } } }
}
```

### Champs custom ajoutés au document `user`

| Champ | Type | Valeur par défaut |
|-------|------|-------------------|
| `firstName` | string | `""` |
| `lastName` | string | `""` |
| `age` | number | `null` |
| `gender` | string | `""` |
| `role` | string | `"unassigned"` |
| `imagePublicId` | string | `""` |

## 4. Procédures externes

| Export | Type | Rôle |
|--------|------|------|
| `auth` | `BetterAuth` | Instance principale, utilisée pour `auth.api.*` |
| `requireEmailVerification` | `boolean` | Vrai si `REQUIRE_EMAIL_VERIFICATION === "true"` |

### `auth.api.*` — méthodes les plus utilisées

| Méthode | Usage |
|---------|-------|
| `auth.api.getSession({ headers })` | Récupère la session active (utilisé dans middleware) |
| `auth.api.updateUser({ body, headers })` | Met à jour le profil utilisateur |
| `auth.api.sendVerificationEmail({ body })` | Renvoie un email de vérification |
| `auth.api.verifyPassword({ body, headers })` | Vérifie le mot de passe actuel (avant suppression) |
| `auth.api.listUserAccounts({ headers })` | Liste les providers liés (credential, google) |

## 5. Variables externes

- `requireEmailVerification` (boolean) — utilisée par les services qui veulent vérifier l'état de l'email.

## 6. Notes d'implémentation

### Pourquoi un MongoClient séparé ?

```js
const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db();
```

Better Auth utilise son propre adapter (`mongodbAdapter`) qui demande un objet `db` du driver natif MongoDB. **On ne peut pas réutiliser la connexion Mongoose** car Mongoose enveloppe le driver dans sa propre couche.

Conséquence : **2 connexions Mongo** sont ouvertes au démarrage : une pour Better Auth, une pour Mongoose. Les deux pointent vers la même base, donc le modèle Mongoose `User` peut lire ce que Better Auth écrit.

### Top-level `await` à l'import

Ce module fait `await client.connect()` au top-level. C'est légal en ESM mais ça veut dire que **l'import de `auth.js` est bloquant** : Node n'exécutera les imports suivants qu'une fois Better Auth connecté. C'est pourquoi `server.js` fait `import { auth } from "./auth.js"` AVANT `connectDB()`.

### baseURL dynamique en production

```js
baseURL: isProduction
  ? {
      allowedHosts,
      fallback: process.env.BETTER_AUTH_URL,
      protocol: "https",
    }
  : process.env.BETTER_AUTH_URL,
```

En prod, Better Auth lit le header `x-forwarded-host` (ajouté par Vercel quand il rewrite `/api/*` vers Railway) pour savoir sur quel domaine poser le cookie. Cette config gère les domaines autorisés + un fallback si pas de proxy.

### Cookies en production

```js
advanced: {
  defaultCookieAttributes: {
    sameSite: "none",
    secure: true,
  },
}
```

`sameSite: "none"` est nécessaire pour que le cookie traverse le rewrite Vercel sans être bloqué.
`secure: true` impose HTTPS (donc impossible en dev sans certificat).

### Hook `before` à l'inscription email

```js
hooks: {
  before: async (ctx) => {
    if (ctx.path === "/sign-up/email") {
      const role = ctx.body?.role;
      if (role && !["buyer", "seller"].includes(role)) {
        throw new APIError("BAD_REQUEST", { message: `Invalid role...` });
      }
    }
  },
},
```

Ce hook intercepte toutes les requêtes Better Auth AVANT qu'elles soient traitées. Ici, on valide que `role` est `buyer` ou `seller` (sinon le frontend pourrait envoyer `role: "admin"` et créer un admin par accident).

### Hook `databaseHooks.user.create.before`

Cette fonction est appelée juste avant d'insérer un nouveau user. Elle force `emailVerified` :
- `true` si OAuth Google (qui valide l'email automatiquement)
- `true` si `REQUIRE_EMAIL_VERIFICATION` est désactivé
- `false` sinon (déclenche l'envoi d'un email de vérification)

### `user.deleteUser.beforeDelete`

Hook qui s'exécute avant la suppression d'un compte. Appelle `getAccountDeletionBlockReason()` pour bloquer la suppression s'il y a des commandes en cours, puis `cleanupDeletedUserData()` pour soft-delete la boutique, supprimer le panier et les adresses.

### Google OAuth — `mapProfileToUser`

Mappe les champs Google (`given_name`, `family_name`) vers nos champs (`firstName`, `lastName`). On ne mappe pas `picture` parce que Better Auth gère déjà le champ `image` automatiquement.

### `trustedOrigins`

Liste des origines autorisées à appeler les routes d'auth. Si une requête arrive d'une origine non listée, Better Auth la rejette pour empêcher les attaques CSRF.
