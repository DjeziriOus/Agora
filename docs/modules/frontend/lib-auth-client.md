# Module : `frontend/src/lib/auth-client.ts`

## 1. Objectifs du module

Créer et exporter une **instance Better Auth React** (`authClient`) qui parle au backend pour toutes les opérations d'authentification.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `better-auth/react` — `createAuthClient`
- `@/config` — `API_URL`

### Modules qui utilisent ce module

- `frontend/src/context/AuthContext.tsx` — `authClient.signIn`, `authClient.signUp`, `authClient.getSession`, `authClient.signOut`
- `frontend/app/(auth)/login/page.tsx` — `authClient.signIn.social({ provider: "google" })`
- `frontend/app/(auth)/register/page.tsx` (indirectement via AuthContext)
- `frontend/app/(auth)/oauth-callback/page.tsx` (indirectement)

## 3. Définitions de types / attributs

### `authClient`

Objet exposé par Better Auth React avec les méthodes :

```ts
{
  signIn: {
    email({ email, password }),
    social({ provider, callbackURL, errorCallbackURL })
  },
  signUp: {
    email({ email, password, name, firstName, lastName, role, ... })
  },
  signOut(),
  getSession(),
  // + d'autres : changeEmail, changePassword, updateUser, deleteUser, sendVerificationEmail, etc.
}
```

## 4. Procédures externes

| Export | Type | Rôle |
|--------|------|------|
| `authClient` | `BetterAuthClient` | À utiliser dans tout le frontend pour parler à Better Auth |

## 5. Variables externes

- `baseURL` (interne) — calculé selon qu'on soit dans le navigateur ou SSR.

## 6. Notes d'implémentation

### `baseURL` dynamique

```ts
const baseURL = typeof window !== "undefined" ? window.location.origin : API_URL;
```

- En **navigateur** (`window` défini) → utilise `window.location.origin`, c'est-à-dire `https://example.com`. Les appels vont sur `/api/auth/*` qui est ensuite **proxifié** par Next.js vers le backend (rewrite). Le cookie reste first-party.
- En **SSR** (`window` undefined) → utilise `API_URL` (la variable d'env, qui pointe directement vers le backend). Pas de problème de cookies parce que SSR n'a pas de browser.

**C'est essentiel** pour que l'auth marche dans Brave / Chrome avec 3PCD bloqué.

### Header `ngrok-skip-browser-warning`

```ts
fetchOptions: {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
},
```

Comme dans `api.ts`, pour gérer les tunnels ngrok en dev. Inoffensif en production.

### `createAuthClient` est un singleton

Ce fichier est importé une fois et `authClient` est partagé partout. Pas besoin d'instance par composant.

### Pas de wrapper de gestion d'erreur

Contrairement à `apiFetch`, ce client ne pose **pas** de toast automatique en cas d'erreur. Les appelants (AuthContext, pages) doivent gérer l'erreur :

```ts
const { data, error } = await authClient.signIn.email({ email, password });
if (error) {
  if (error.code === "...") { ... }
  throw new Error(error.message);
}
```

Cette API « data + error » à la place des exceptions est une convention de Better Auth.
