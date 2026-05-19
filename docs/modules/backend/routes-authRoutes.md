# Module : `backend/routes/authRoutes.js`

## 1. Objectifs du module

Définir les routes HTTP de **gestion du compte utilisateur** : profil, photo, renvoi de mail de vérification, et vérification pré-suppression.

⚠️ **Ne pas confondre** avec les routes Better Auth (`/api/auth/sign-in`, `/sign-up`, etc.) qui sont gérées automatiquement par le catch-all dans `server.js`. Ce fichier-ci complète Better Auth avec des routes applicatives sous `/api/account/*`.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `express` — Router
- `better-auth/node` — `fromNodeHeaders`
- `../auth.js` — instance Better Auth
- `../controllers/authController.js` — handlers : `getProfile`, `resendVerificationEmail`, `updateProfilePicture`, `deleteProfilePicture`
- `../middleware/auth.js` — `verifyToken`
- `../middleware/upload.js` — `uploadAvatar`
- `../middleware/rateLimiter.js` — `resendLimiter`
- `../services/accountDeletionService.js` — `getAccountDeletionBlockReason`

### Modules qui utilisent ce module

- `backend/server.js` — `app.use("/api/account", accountRoutes)`

## 3. Définitions de types / attributs

Voir les schémas Mongoose `User` pour la forme des objets retournés.

## 4. Procédures externes (routes HTTP)

| Méthode | Chemin | Auth | Rôle |
|---------|--------|------|------|
| GET | `/api/account/me` | verifyToken | Profil du user connecté |
| PUT | `/api/account/profile-picture` | verifyToken + uploadAvatar | Upload/remplacement de la photo |
| DELETE | `/api/account/profile-picture` | verifyToken | Supprime la photo de profil |
| POST | `/api/account/resend-verification` | resendLimiter + verifyToken | Renvoie l'email de vérification |
| POST | `/api/account/delete-check` | verifyToken | Vérifie qu'on peut supprimer le compte (mot de passe + commandes en cours) |

## 5. Variables externes

Aucune (l'export est le router).

## 6. Notes d'implémentation

### `POST /api/account/delete-check` — la route la plus complexe

Cette route est appelée AVANT la suppression réelle du compte (qui se fait via Better Auth `auth.deleteUser()`). Elle :

1. Lit le mot de passe envoyé par le frontend.
2. Vérifie qu'il existe un compte « credential » (mot de passe) lié à l'utilisateur. Sinon, on lui demande d'en définir un d'abord. Cas concret : un user OAuth Google qui n'a jamais défini de mot de passe local.
3. Appelle `auth.api.verifyPassword({ body: { password }, headers })` pour valider le mot de passe.
4. Appelle `getAccountDeletionBlockReason()` pour bloquer si des commandes sont en cours.
5. Renvoie `{ status: true }` en cas de succès, ou un objet d'erreur structuré sinon.

Les codes d'erreur structurés permettent au frontend d'afficher des messages précis :

| Code | Sens |
|------|------|
| `PASSWORD_REQUIRED` | Pas de mot de passe envoyé |
| `INVALID_PASSWORD` | Mot de passe incorrect |
| `CREDENTIAL_ACCOUNT_NOT_FOUND` | Pas de mot de passe défini (OAuth-only) |
| `PENDING_CLIENT_ORDERS` | Acheteur a des commandes en cours |
| `PENDING_SELLER_ORDERS` | Vendeur a des commandes à traiter |
| `DELETE_ACCOUNT_CHECK_FAILED` | Erreur générique |

### Pourquoi cette pré-vérification ?

La suppression réelle se fait par Better Auth (qui appelle ensuite notre hook `beforeDelete` dans `auth.js`). Mais la suppression Better Auth ne fait PAS de feedback détaillé en cas de blocage. Cette route permet au frontend d'afficher un dialogue clair AVANT de lancer la suppression effective.

### Doublon avec `accountDeletionRoutes.js` (legacy)

Le fichier `routes/accountDeletionRoutes.js` contient une version antérieure de `delete-check`. Il n'est PAS monté dans `server.js` (la ligne est commentée). C'est du code mort à supprimer un jour.

### Profile picture — séparation des préoccupations

`PUT /api/account/profile-picture` :
1. Upload la nouvelle image vers Cloudinary.
2. Lit l'ancien `imagePublicId` depuis la base.
3. Met à jour le user via Better Auth (`auth.api.updateUser`).
4. Supprime l'ancienne image de Cloudinary (fire-and-forget).

Le succès est lié à l'étape 3 (Better Auth a accepté la mise à jour). Si l'étape 4 échoue, on a une image orpheline mais ça n'impacte pas l'expérience.

### `auth.api.updateUser` vs accès direct à la collection

On utilise `auth.api.updateUser` plutôt que `User.findByIdAndUpdate` parce que :
- Better Auth synchronise la session avec les modifications.
- Better Auth peut déclencher des hooks (par exemple `databaseHooks.user.update`).
- C'est la source de vérité — il vaut mieux que tout transite par lui pour éviter les désynchronisations.

### Rate limiting

`POST /api/account/resend-verification` est protégé par `resendLimiter` (3 / 5 min par IP). Ça suffit en pratique : un user qui clique frénétiquement sera bloqué, mais un user honnête peut renvoyer 3 fois en cas de problème.
