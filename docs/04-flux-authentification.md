# Flux d'authentification (F1)

Ce document décrit comment fonctionne l'authentification du début à la fin.
C'est la partie la plus subtile du projet — lis-la attentivement si tu touches au code d'auth.

## 🎯 Vue d'ensemble

L'authentification est gérée par **Better Auth**, une bibliothèque qui prend en charge :

- Inscription (`POST /api/auth/sign-up/email`)
- Connexion (`POST /api/auth/sign-in/email`)
- Déconnexion (`POST /api/auth/sign-out`)
- OAuth Google (`GET /api/auth/sign-in/social/google`)
- Vérification d'email (`GET /api/auth/verify-email`)
- Reset mot de passe (`POST /api/auth/forget-password`)
- Récupération de session (`GET /api/auth/get-session`)
- Liste des comptes liés (`POST /api/auth/list-accounts`)
- Mise à jour du profil, changement d'email, suppression de compte, etc.

**Tout ce qui passe par `/api/auth/*` est géré par Better Auth**, pas par le code applicatif.

## 🏗️ Architecture

```
   Navigateur                Frontend Next.js              Backend Express
   ──────────                ────────────────              ───────────────

   [Formulaire login]
        │
        │ authClient.signIn.email(...)
        ▼
   /api/auth/sign-in/email
   (sur le domaine du frontend)
        │
        │ rewrites de next.config.mjs
        ▼
   ──────────────────────►  /api/auth/sign-in/email
                            (sur le domaine du backend)
                                  │
                                  │ catch-all : app.all("/api/auth/*splat", toNodeHandler(auth))
                                  ▼
                            Better Auth handler
                                  │
                                  │ vérifie le mot de passe, crée une session
                                  ▼
                            MongoClient natif → écrit dans la collection `sessions`
                                  │
                                  ▼
                            Renvoie HTTP 200 + Set-Cookie: better-auth.session_token=...
                                  │
   ◄──────────────────────────────┘
   Cookie reçu (first-party, marqué comme venant du domaine du frontend)
        │
        ▼
   Toutes les requêtes suivantes envoient le cookie automatiquement
```

## 🍪 Le cookie de session : pourquoi le proxy est nécessaire

C'est LE point qui pose le plus de soucis. Voici le contexte :

### Le problème

Si on déploie le backend sur `api.example.com` et le frontend sur `example.com`, alors quand le frontend
appelle `https://api.example.com/api/auth/sign-in/email`, le cookie envoyé en réponse est considéré
comme **third-party** par le navigateur (parce qu'il vient d'un domaine différent).

Les navigateurs modernes (Brave, Chrome avec 3PCD activé, Safari) **bloquent ces cookies third-party**.
Résultat : le cookie n'est pas stocké, et toutes les requêtes suivantes sont en 401 Unauthorized.

### La solution

Le frontend appelle TOUJOURS `/api/*` sur son propre domaine (`example.com/api/...`).
Next.js intercepte ces requêtes via **rewrites** et les transmet au backend en interne :

```js
// frontend/next.config.mjs
async rewrites() {
  return [
    { source: "/api/:path*", destination: `${backend}/api/:path*` }
  ];
}
```

Du point de vue du navigateur, la requête sort et entre sur le même domaine → cookie first-party → 🎉 ça marche.

### Côté Better Auth (backend)

Better Auth a besoin de savoir sur quel domaine le cookie doit être posé. En production, on lui dit :
« utilise le domaine du frontend » via `baseURL.allowedHosts`. Le header `x-forwarded-host` (ajouté
par Vercel quand il rewrite la requête) lui indique ce domaine.

Voir `backend/auth.js` :

```js
baseURL: isProduction
  ? {
      allowedHosts,                          // domaines autorisés (frontend + backend)
      fallback: process.env.BETTER_AUTH_URL, // fallback si pas de proxy
      protocol: "https",
    }
  : process.env.BETTER_AUTH_URL,            // en dev, simple
```

## 📝 Les rôles utilisateur

Un user a un champ `role` qui peut valoir :

| Rôle | Sens |
|------|------|
| `unassigned` | Inscription terminée mais le rôle n'a pas encore été choisi. Cas typique : un user OAuth Google qui se connecte pour la première fois. |
| `buyer` | Acheteur classique. Peut parcourir le catalogue, ajouter au panier, passer commande. |
| `seller` | Vendeur. Peut créer une boutique, gérer ses produits, voir ses commandes. **Ne peut PAS acheter.** |
| `admin` | Réservé. Aucune route admin n'est implémentée actuellement. |

### Choix du rôle

Le rôle est :
- **Demandé à l'inscription email/mot de passe** (formulaire `/register` → envoie `role: "buyer"` ou `"seller"` au backend).
- **Validé par Better Auth** dans un hook `before` de `/sign-up/email` (rejet si autre que `buyer` ou `seller`).
- **Non défini pour OAuth Google** au premier login → le user passe par `/choose-role` qui propose un choix.

Le frontend implémente une garde dans `AuthContext` qui redirige tout user `unassigned` vers `/choose-role` (sauf s'il est déjà sur une des pages permises : login, register, verify-email, oauth-callback, choose-role).

## 🔒 Routes protégées (côté backend)

Le middleware d'auth se trouve dans `backend/middleware/auth.js`. Trois middlewares principaux :

### `verifyToken`

Lit le cookie de session, appelle `auth.api.getSession()` pour le valider, et attache `req.user` :

```js
export const verifyToken = async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  req.user = session.user;
  next();
};
```

**Toute route qui demande un user authentifié doit utiliser `verifyToken` en premier.**

### `isSeller`

Bloque les non-vendeurs (à utiliser après `verifyToken`) :

```js
router.use(verifyToken, isSeller);   // toutes les routes seller-only
```

### `isBuyer`

Bloque les non-acheteurs :

```js
router.use(verifyToken, isBuyer);    // toutes les routes buyer-only
```

### `requireVerifiedEmail`

Bloque les users dont l'email n'est pas vérifié (utilisé pour les actions sensibles comme passer une commande).

## ✉️ Vérification d'email

Le projet a un **mode configurable** via la variable `REQUIRE_EMAIL_VERIFICATION` :

- Si `REQUIRE_EMAIL_VERIFICATION=true` :
  - À l'inscription, Better Auth envoie un email de vérification.
  - Tant que le user ne clique pas sur le lien, il peut quand même se connecter et naviguer, **mais** :
    - Il ne peut pas créer de boutique (`shopService.createShop` vérifie ce flag).
    - Il ne peut pas passer commande (middleware `requireVerifiedEmail`).
  - Un bandeau d'avertissement (`VerificationBanner`) s'affiche en haut du site.
- Si `REQUIRE_EMAIL_VERIFICATION=false` (dev par défaut) :
  - Les emails sont automatiquement marqués comme vérifiés à l'inscription.
  - Aucun bandeau, aucun blocage.

Le flag est exposé au frontend via `GET /api/auth/config` (route publique dédiée, montée AVANT le catch-all Better Auth dans `server.js`).

## 🔑 OAuth Google

Configuré dans `backend/auth.js → socialProviders.google`. Particularités :

### URL de redirection après Google

```js
redirectURI: `${process.env.FRONTEND_URL}/api/auth/callback/google`,
```

On envoie Google **vers le frontend** (et non vers le backend) pour la même raison de cookies : si Google
renvoyait directement vers `api.example.com/api/auth/callback/google`, le cookie `state` (utilisé pour
prévenir les attaques CSRF OAuth) serait perdu en chemin.

### Map du profil Google vers les champs Agora

```js
mapProfileToUser: async (profile) => ({
  firstName: profile.given_name || "",
  lastName: profile.family_name || "",
}),
```

Le user Google arrive donc avec `firstName`, `lastName` remplis mais `role: "unassigned"` → il est
redirigé vers `/choose-role` à la première connexion.

### Erreurs Google fréquentes

- **`state_mismatch`** : le cookie `state` a été bloqué/perdu. Solution : vérifier que le proxy
  Vercel fonctionne et que `FRONTEND_URL` est bien configuré.
- **`invalid_grant`** : le `refresh_token` est expiré ou révoqué. Solution : régénérer un refresh token
  via Google OAuth Playground.

## 🔄 Cycle de vie complet d'un utilisateur

### 1. Inscription email/mot de passe (acheteur)

```
   Utilisateur                Frontend                 Backend
   ───────────                ────────                 ───────

   Remplit /register
   role = "buyer"
   ────────────────►
                              authClient.signUp.email({
                                email, password, name,
                                firstName, lastName, role: "buyer"
                              })
                              ──────────────────────►
                                                       POST /api/auth/sign-up/email
                                                       │
                                                       ├─ hook before : valide role ∈ {buyer, seller}
                                                       │
                                                       ├─ databaseHooks.user.create.before :
                                                       │  force emailVerified selon REQUIRE_EMAIL_VERIFICATION
                                                       │
                                                       ├─ Crée le user
                                                       │
                                                       ├─ Si REQUIRE_EMAIL_VERIFICATION :
                                                       │   envoie l'email de vérification
                                                       │
                                                       └─ Crée la session (cookie Set-Cookie)
                                                       ──────────────────────►
   ◄──────────────────────── retour avec user
   redirige vers /verify-email (si pas vérifié)
   ou /catalogue (si vérifié)
```

### 2. Connexion email/mot de passe

```
   /login
   ──────────────►  authClient.signIn.email({ email, password })
                    ──────────────────►  POST /api/auth/sign-in/email
                                          │
                                          ├─ Vérifie le mot de passe
                                          ├─ Crée une session
                                          └─ Set-Cookie session
                                          ◄──────────────────
                    ◄──────────────────  retour avec user
   ◄──────────────  Le user est connecté
                    AuthContext.login() redirige selon le rôle :
                    - seller avec boutique → /vendeur
                    - seller sans boutique → /vendeur/boutique
                    - buyer → /
```

### 3. Connexion OAuth Google (première fois)

```
   /login
   Click "Continuer avec Google"
   ──────────────►  authClient.signIn.social({ provider: "google", callbackURL: "/oauth-callback" })
                    ──────────────────────►  GET /api/auth/sign-in/social/google
                                              │
                                              ├─ Génère un state CSRF
                                              ├─ Set-Cookie state
                                              └─ 302 redirect vers Google
                                              ◄──────────────────────
   ◄──────────────  Le navigateur va sur accounts.google.com
   Utilisateur autorise
   ──────────────►  Google redirige vers FRONTEND_URL/api/auth/callback/google?code=...&state=...
                    ──────────────────────►  /api/auth/callback/google (rewrite vers backend)
                                              │
                                              ├─ Vérifie state CSRF (cookie)
                                              ├─ Échange code → tokens Google
                                              ├─ Crée ou retrouve le user
                                              │   (avec role: "unassigned" si nouveau)
                                              └─ Crée la session + redirige vers /oauth-callback
                                              ◄──────────────────────
   /oauth-callback récupère la session, AuthContext se met à jour
   Si role === "unassigned" → redirige vers /choose-role
   Sinon → / ou /vendeur selon le rôle
```

### 4. Vérification d'email

```
   Email reçu
   Click sur le lien
   ──────────────►  GET /api/auth/verify-email?token=...&callbackURL=/email-verified
                    │
                    ├─ Valide le token (collection `verifications`)
                    ├─ Marque le user emailVerified: true
                    ├─ Auto-connecte le user
                    └─ Redirige vers /email-verified
                    ◄────────────
   ◄──────────────  Page de succès, redirection vers /
```

### 5. Déconnexion

```
   Click "Déconnexion"
   ──────────────►  authClient.signOut()
                    ──────────────────────►  POST /api/auth/sign-out
                                              │
                                              ├─ Supprime la session en base
                                              └─ Set-Cookie expiré
                                              ◄──────────────────────
   ◄──────────────  Cookie supprimé
   AuthContext.logout() → setUser(null) → router.push("/login")
```

### 6. Suppression de compte

```
   /compte/parametres
   Click "Supprimer mon compte"
   ──────────────►  POST /api/account/delete-check { password }
                    ──────────────────────►  authRoutes.js
                                              │
                                              ├─ Vérifie le mot de passe (auth.api.verifyPassword)
                                              ├─ Appelle getAccountDeletionBlockReason()
                                              │   → bloque si commande en cours
                                              └─ Renvoie OK si tout est bon
                                              ◄──────────────────────
   ◄──────────────  Confirme à l'utilisateur que la suppression est possible
   ──────────────►  authClient.deleteUser()
                    ──────────────────────►  POST /api/auth/delete-user
                                              │
                                              ├─ Better Auth hook user.deleteUser.beforeDelete :
                                              │   appelle cleanupDeletedUserData()
                                              │   → soft-delete shop + produits si vendeur
                                              │   → supprime cart + addresses
                                              ├─ Supprime le user, ses sessions, ses accounts
                                              └─ Set-Cookie expiré
                                              ◄──────────────────────
   ◄──────────────  Redirige vers /
```

## 🛡️ Sécurité — résumé des protections en place

| Risque | Comment c'est protégé |
|--------|-----------------------|
| Vol de session | Cookies signés par Better Auth, expiration automatique |
| CSRF | Cookies `SameSite=lax` en dev, `SameSite=none + Secure` en prod, et state CSRF sur OAuth |
| Mot de passe en clair | Better Auth hash avec bcrypt avant de stocker |
| Brute force vérification | Rate limiter sur `POST /api/account/resend-verification` (3 tentatives / 5 min) |
| Suppression d'un compte avec commandes en cours | Vérification `getAccountDeletionBlockReason` avant tout |
| Mauvais rôle à l'inscription | Hook Better Auth `before` rejette les rôles non autorisés |
| Accès à des routes seller depuis un compte buyer | Middlewares `isSeller` / `isBuyer` sur toutes les routes |
| XSS dans les emails | Échappement HTML dans `emailTemplates.js` (fonction `escape`) |

## 🐛 Debug rapide

Si l'auth est cassée, vérifier dans l'ordre :

1. **Le cookie est-il bien posé ?** Inspecter dans DevTools → Application → Cookies. Si absent, regarder la console réseau pour `Set-Cookie`.
2. **Le proxy fonctionne-t-il ?** `curl https://example.com/api/auth/get-session` doit renvoyer du JSON (pas une page Next.js).
3. **`NEXT_PUBLIC_API_URL` est-il défini ?** Sinon, les rewrites Next plantent au démarrage.
4. **Les logs du backend** : `[auth] NODE_ENV: ...` et `[auth] BETTER_AUTH_URL: ...` apparaissent au démarrage du backend.
5. **Pour OAuth Google** : vérifier dans la Google Cloud Console que l'URL de redirection autorisée est bien `${FRONTEND_URL}/api/auth/callback/google`.
