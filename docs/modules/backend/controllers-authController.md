# Module : `backend/controllers/authController.js`

## 1. Objectifs du module

Fournir les **handlers HTTP** pour les routes de gestion de compte montées dans `authRoutes.js`.

Le rôle du contrôleur : extraire les paramètres de la requête HTTP, appeler le service métier, formatter la réponse JSON, gérer les erreurs HTTP.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `../services/authService.js` — `getProfile`, `resendVerificationEmail`
- `../config/cloudinary.js` — `uploadToCloudinary`, `deleteFromCloudinary`
- `../models/User.js` — pour lire l'`imagePublicId` existant
- `../auth.js` — instance Better Auth
- `better-auth/node` — `fromNodeHeaders`

### Modules qui utilisent ce module

- `backend/routes/authRoutes.js`

## 3. Définitions de types / attributs

Aucun.

## 4. Procédures externes

| Fonction | Route Express | Rôle |
|----------|---------------|------|
| `getProfile` | `GET /api/account/me` | Retourne le user populé depuis la base |
| `resendVerificationEmail` | `POST /api/account/resend-verification` | Appelle Better Auth pour renvoyer un mail |
| `updateProfilePicture` | `PUT /api/account/profile-picture` | Upload Cloudinary + update user via Better Auth |
| `deleteProfilePicture` | `DELETE /api/account/profile-picture` | Supprime Cloudinary + reset les champs `image` |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `updateProfilePicture` — séquence sensible

```
1. Vérifier qu'un fichier a été envoyé (sinon 400).
2. Uploader le nouveau fichier sur Cloudinary (preset "avatar").
3. Lire l'ancien `imagePublicId` du user.
4. Mettre à jour via Better Auth (auth.api.updateUser) — synchronise la session.
5. Supprimer l'ancien Cloudinary (fire-and-forget).
```

Ordre choisi : la session est synchronisée AVANT de supprimer l'ancienne image. Si la 4ème étape échoue, on a un upload Cloudinary inutile (mais le user ne le voit pas), et l'ancienne image est toujours là. État cohérent.

### Catch global avec fallback message

Toutes les fonctions utilisent ce pattern :

```js
catch (error) {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Erreur lors de ..."
  });
}
```

Les erreurs émises par les services portent un `statusCode` (4xx) → renvoyé tel quel. Les erreurs inattendues → 500 par défaut.

### Pourquoi appeler Better Auth pour update plutôt que User.findByIdAndUpdate ?

Voir `routes-authRoutes.md` section similaire. En résumé : pour garder la session à jour et déclencher les hooks Better Auth.

### `req.user._id` vs `req.user.id`

Dans `getProfile`, on lit `req.user._id`. Dans les autres, on lit `req.user.id`. C'est inconsistant et c'est une bizarrerie. En pratique les deux marchent (Better Auth expose les deux). À normaliser un jour.
