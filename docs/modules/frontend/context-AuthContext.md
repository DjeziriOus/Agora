# Module : `frontend/src/context/AuthContext.tsx`

## 1. Objectifs du module

Fournir **l'état global d'authentification** à toute l'application via un Context React.

Gère :
- L'état `user` courant (chargé depuis Better Auth).
- Les actions `login`, `register`, `logout`, `resendVerification`.
- La récupération de la config d'auth backend (flag `requireEmailVerification`).
- La gestion de l'email en attente de vérification (avec persistance dans `sessionStorage`).
- Les redirections automatiques selon le rôle (notamment vers `/choose-role` si `unassigned`).

C'est **l'un des deux contextes** principaux du frontend (avec `CartContext`).

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `react` — `createContext`, `useContext`, `useState`, `useEffect`, `useCallback`
- `next/navigation` — `useRouter`, `usePathname`
- `@/lib/auth-client` — `authClient`
- `@/config` — `API_URL`
- `@/types` — `User`

### Modules qui utilisent ce module

Énormément de fichiers. Les plus importants :
- `frontend/app/layout.tsx` — `<AuthProvider>` enveloppe toute l'app
- `frontend/src/components/Navbar.tsx`
- `frontend/src/components/VendorSidebar.tsx`
- `frontend/src/components/VerificationBanner.tsx`
- Toutes les pages auth (`/login`, `/register`, etc.)
- `frontend/src/context/CartContext.tsx` (dépend de `useAuth` pour activer/désactiver le panier)
- `frontend/src/hooks/useCart.ts`

## 3. Définitions de types / attributs

### `AuthContextType`

```ts
{
  user: User | null,
  isAuthenticated: boolean,            // !!user
  isSeller: boolean,                   // user?.role === "seller"
  isLoading: boolean,
  isAuthConfigLoading: boolean,
  requireEmailVerification: boolean,
  emailNotVerified: boolean,           // legacy, plus utilisé
  pendingVerificationEmail: string | null,

  clearEmailNotVerified: () => void,
  ensureAuthConfig: () => Promise<boolean>,
  setPendingVerificationEmail: (email: string) => void,
  clearPendingVerificationEmail: () => void,
  refreshSession: () => Promise<void>,
  login: (email, password) => Promise<User | null>,
  register: (data) => Promise<{ emailVerified }>,
  logout: () => Promise<void>,
  resendVerification: () => Promise<void>,
}
```

### Type `User` (depuis `@/types`)

```ts
{
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  role: "buyer" | "seller" | "unassigned",
  emailVerified: boolean,
  image?: string,
}
```

## 4. Procédures externes

### Composants

| Export | Type | Rôle |
|--------|------|------|
| `AuthProvider` | Component | À placer au plus haut niveau (dans `layout.tsx`) |

### Hook

| Export | Type | Rôle |
|--------|------|------|
| `useAuth` | Hook | À utiliser dans n'importe quel composant client pour lire l'état |

### Actions exposées par le hook

| Méthode | Effet |
|---------|-------|
| `login(email, password)` | Connecte via Better Auth, retourne le user mappé |
| `register({ firstName, lastName, email, password, role })` | Inscrit + retourne `{ emailVerified }` |
| `logout()` | Déconnecte + clear pending email + redirige vers `/login` |
| `refreshSession()` | Force un re-fetch de la session courante |
| `resendVerification()` | Appelle `/api/account/resend-verification` |
| `ensureAuthConfig()` | Lit `/api/auth/config` pour obtenir le flag verification |

## 5. Variables externes

| Variable | Type | Rôle |
|----------|------|------|
| `PENDING_VERIFICATION_EMAIL_STORAGE_KEY` | string | Clé sessionStorage pour persister l'email en attente |

(En réalité interne, pas exportée — mais c'est une clé de stockage à connaître.)

## 6. Notes d'implémentation

### `mapUser` — transformation Better Auth → User

```ts
function mapUser(sessionUser: Record<string, unknown>): User {
  return {
    id: sessionUser.id as string,
    email: sessionUser.email as string,
    firstName: (sessionUser.firstName as string) ?? "",
    lastName: (sessionUser.lastName as string) ?? "",
    role: (sessionUser.role as "buyer" | "seller" | "unassigned") ?? "unassigned",
    emailVerified: Boolean(sessionUser.emailVerified),
    image: (sessionUser.image as string | undefined) ?? undefined,
  };
}
```

Better Auth renvoie l'utilisateur avec tous ses champs custom (firstName, etc.) mais en `Record<string, unknown>`. On le map vers notre type strict `User`.

### Hydratation initiale au mount

```js
useEffect(() => {
  const initAuth = async () => {
    try {
      const { data } = await authClient.getSession();
      if (data?.user) {
        setUser(mapUser(data.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  void initAuth();
  // ... récupère aussi le pendingEmail depuis sessionStorage
}, []);
```

Au premier rendu, on essaie de récupérer la session côté backend (via le cookie). Pendant ce temps, `isLoading: true` → les composants peuvent afficher un loader.

### Redirection automatique pour `unassigned`

```js
useEffect(() => {
  if (isLoading || !user) return;
  if (user.role !== "unassigned") return;

  const allowedPaths = ["/choose-role", "/login", "/register", "/verify-email", "/oauth-callback"];
  if (allowedPaths.includes(pathname)) return;

  router.replace("/choose-role");
}, [isLoading, pathname, router, user]);
```

Si l'utilisateur n'a pas choisi son rôle (typiquement après une première connexion OAuth Google), on le force à passer par `/choose-role` avant de pouvoir naviguer ailleurs.

### `pendingVerificationEmail` — persisté dans `sessionStorage`

Permet à la page `/verify-email` de connaître l'email en attente même après un refresh du navigateur. Stocké en `sessionStorage` (effacé à la fermeture du navigateur), pas `localStorage` (qui durerait indéfiniment).

### `ensureAuthConfig` — actuellement pas appelé

`useEffect` du provider ne déclenche pas `ensureAuthConfig` automatiquement (la ligne est commentée). C'est à chaque page d'auth d'appeler `ensureAuthConfig()` quand elle a besoin de connaître le flag `requireEmailVerification`.

### `register` — pas de redirection automatique

```js
return { emailVerified: userData?.user?.emailVerified };
```

Après inscription, le contexte renvoie juste l'info `emailVerified` mais ne redirige PAS. C'est à `RegisterPage` de décider :
- Si vérifié → redirige vers `/catalogue`.
- Sinon → redirige vers `/verify-email`.

### `logout` — clear pending email

```js
const logout = useCallback(async () => {
  await authClient.signOut();
  setUser(null);
  clearPendingVerificationEmail();   // ← important
  router.push("/login");
}, [clearPendingVerificationEmail, router]);
```

On nettoie le pending email pour ne pas afficher la verification d'un autre user qui se connecte ensuite.

### Bug noté : `pendingVerificationEmail` dupliqué dans le type

Le type `AuthContextType` déclare `pendingVerificationEmail: string | null` DEUX fois (lignes 31 et 37 du fichier). C'est une redondance harmless mais à nettoyer.
