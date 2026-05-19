# Module : `backend/services/authService.js`

## 1. Objectifs du module

Petit service utilitaire pour deux opérations liées au profil utilisateur :
- Récupérer le profil complet (par ID).
- Renvoyer un email de vérification.

⚠️ **Attention au nom trompeur** : ce service n'implémente PAS l'authentification (signup, signin, etc.). Toute l'auth est gérée par Better Auth (`backend/auth.js`). Ce fichier est presque vide et résiduel d'une ancienne implémentation maison.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../models/User.js` — modèle Mongoose
- `../auth.js` — instance Better Auth

### Modules qui utilisent ce module

- `backend/controllers/authController.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `getProfile` | `(userId: string) => Promise<User>` | Charge le user via Mongoose. 404 si introuvable. |
| `resendVerificationEmail` | `(userId: string) => Promise<void>` | Récupère le user, vérifie qu'il n'est pas déjà vérifié, appelle Better Auth pour renvoyer un mail. |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `.select('-password')` est inutile

Dans `getProfile`, le code fait `User.findById(userId).select('-password')`. Le modèle `User` n'a PAS de champ `password` (les mots de passe sont stockés dans la collection `accounts` par Better Auth). Cette ligne est un reliquat d'une ancienne version avec auth maison. Pas nuisible mais redondant.

### `resendVerificationEmail` → Better Auth

```js
await auth.api.sendVerificationEmail({
  body: { email: user.email, callbackURL: "/email-verified" },
});
```

On déléguue à Better Auth qui :
1. Crée un nouveau token de vérification.
2. Envoie l'email (via le `sendVerificationEmail` hook configuré dans `auth.js` → notre `emailService`).
3. Le user clique → redirection vers `/email-verified`.

### Si on doit étendre ce service

Tout ce qui touche à l'auth devrait passer par Better Auth (`auth.api.*`) plutôt que par Mongoose direct. Le modèle `User` Mongoose est utilisé UNIQUEMENT pour les `.populate()` et la lecture (pas l'écriture).
