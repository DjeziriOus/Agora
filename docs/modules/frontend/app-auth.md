# Module : `frontend/app/(auth)/`

## 1. Objectifs du module

Regroupe toutes les **pages d'authentification** : connexion, inscription, vérification d'email, choix de rôle, callback OAuth.

C'est un **groupe Next.js** (les parenthèses dans `(auth)` n'apparaissent PAS dans l'URL).

## 2. Relations d'utilisation

### Modules utilisés par ces pages

- `next/navigation` — `useRouter`, `useSearchParams`
- `@/context/AuthContext` — `useAuth`
- `@/lib/auth-client` — `authClient` (Better Auth React)
- `@/lib/api` — `shopsApi` pour rediriger les vendeurs après login
- `lucide-react`, `next/image`, `next/link`, `sonner` — UI
- `@/components/ui/*` — wrappers shadcn

### Modules qui utilisent ce dossier

Aucun (ce sont des pages, point d'entrée du routing).

## 3. Définitions de types / attributs

Pas d'export de type. Chaque page définit ses propres `useState` pour le formulaire local.

## 4. Pages exposées

| Chemin | URL | Rôle |
|--------|-----|------|
| `login/page.tsx` | `/login` | Formulaire email/mot de passe + bouton Google |
| `register/page.tsx` | `/register` | Inscription avec choix de rôle (buyer/seller) |
| `choose-role/page.tsx` | `/choose-role` | Choix de rôle pour les users OAuth nouveaux |
| `verify-email/page.tsx` | `/verify-email` | Page d'attente de la vérification d'email |
| `email-verified/page.tsx` | `/email-verified` | Page de confirmation après clic sur le lien |
| `oauth-callback/page.tsx` | `/oauth-callback` | Callback après auth Google (redirige selon le rôle) |

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### Pas de layout dédié

Le groupe `(auth)` n'a PAS de `layout.tsx` — chaque page utilise directement le layout racine (avec `AuthProvider`, `Toaster`, etc.). Donc pas de Navbar / Footer sur ces pages, ce qui est volontaire (interface épurée pour l'auth).

### Redirection post-login (dans `login/page.tsx`)

Après une connexion réussie :

```js
if (user.role === "seller") {
  const hasStore = await shopsApi.getMyStore().then(s => !!s).catch(() => false);
  router.push(hasStore ? "/vendeur" : "/vendeur/boutique");
} else {
  router.push("/");
}
```

- Vendeur avec boutique → dashboard (`/vendeur`).
- Vendeur sans boutique → page de création (`/vendeur/boutique`).
- Acheteur → page d'accueil.

### Bouton Google OAuth

```js
await authClient.signIn.social({
  provider: "google",
  callbackURL: `${window.location.origin}/oauth-callback`,
  errorCallbackURL: `${window.location.origin}/login?oauthError=1`,
});
```

- `callbackURL` → où aller après auth réussie.
- `errorCallbackURL` → où aller en cas d'échec (le frontend affiche un toast).
- Le `?oauthError=1` est lu dans `login/page.tsx` pour afficher un message d'erreur Brave-spécifique (« Désactivez Shields »).

### `Suspense` wrapper

`login/page.tsx` est wrappé dans un `<Suspense>` parce qu'il utilise `useSearchParams()`. Next.js exige `Suspense` pour ce hook (sinon erreur de build).

### `choose-role/page.tsx` — pour qui ?

Cette page apparait pour les users qui se connectent via Google pour la première fois (donc `role: "unassigned"`). `AuthContext` les redirige automatiquement vers `/choose-role`.

L'utilisateur choisit buyer ou seller, et le frontend met à jour son rôle via `authClient.updateUser({ role: ... })`.

### `verify-email/page.tsx`

Affiche un message « Vérifiez votre boîte mail » + un bouton pour renvoyer l'email. Le frontend ne polle pas pour vérifier la vérification — c'est `email-verified/page.tsx` qui prend la suite après que l'utilisateur ait cliqué sur le lien dans l'email.

### `oauth-callback/page.tsx`

Cette page existe parce que la callback URL passée à Better Auth pointe ici. La page récupère la session, met à jour `AuthContext`, et redirige selon le rôle.
