# Stack technique du projet AGORA

Ce document liste les technologies utilisées, **pourquoi** elles ont été choisies,
et leur rôle dans l'application.

## 🔧 Backend

### Node.js + Express 5

- **Quoi** : Node.js est le moteur JavaScript côté serveur. Express est le framework HTTP qui gère les routes, les middlewares et les requêtes.
- **Pourquoi** : Standard de l'industrie pour les API REST en JavaScript. Express 5 (version moderne) est plus rapide et utilise une syntaxe de route plus stricte.
- **Subtilité Express 5** : la syntaxe `app.all("/api/auth/*", ...)` ne fonctionne plus. Il faut écrire `/api/auth/*splat` (où `splat` est un nom de paramètre arbitraire pour le catch-all).

### MongoDB + Mongoose

- **Quoi** : Base de données NoSQL orientée documents. Mongoose est la bibliothèque qui permet de définir des schémas typés au-dessus de MongoDB.
- **Pourquoi** : Flexibilité pour des entités hétérogènes (produits avec variantes, commandes avec sous-commandes), et adapté aux relations 1:N qui dominent ce projet.
- **Note** : Better Auth utilise sa propre connexion MongoDB native (pas Mongoose) pour ses collections internes (`user`, `sessions`, `accounts`, `verifications`). Le projet partage cependant **la même collection `user`** entre Better Auth et Mongoose, configurée explicitement dans `auth.js` et `models/User.js`.

### Better Auth

- **Quoi** : Bibliothèque d'authentification moderne pour Node.js. Gère email/mot de passe, OAuth (Google), vérification d'email, gestion des sessions par cookie.
- **Pourquoi** : Évite d'écrire un système d'auth à la main (très risqué). Supporte OAuth, multi-providers, et offre une API React (`better-auth/react`) côté frontend.
- **Voir** : `backend/auth.js` pour la configuration complète, et `04-flux-authentification.md` pour le détail du flux.

### Cloudinary

- **Quoi** : Service externe de stockage et transformation d'images.
- **Pourquoi** : MongoDB n'est pas adapté pour stocker des fichiers binaires lourds. Cloudinary gère le redimensionnement, la conversion en WebP, et sert les images via un CDN rapide.
- **Voir** : `backend/config/cloudinary.js`. Les images de produits, logos et bannières de boutique passent toutes par là.
- **Fallback** : Si les variables d'environnement Cloudinary ne sont pas configurées, le projet utilise des URLs `placehold.co` (mode dev).

### Multer

- **Quoi** : Middleware Express qui parse les requêtes `multipart/form-data` (uploads de fichiers).
- **Pourquoi** : Express ne sait pas parser les uploads de fichiers nativement.
- **Voir** : `backend/middleware/upload.js`. Les fichiers sont gardés en mémoire (`memoryStorage`) puis transférés à Cloudinary — aucun fichier n'est écrit sur le disque du serveur.

### Nodemailer (et Google API)

- **Quoi** : Bibliothèque d'envoi d'e-mails. Le projet utilise en réalité l'**API Gmail HTTP** (pas SMTP).
- **Pourquoi SMTP serait gênant** : beaucoup d'hébergeurs (Railway, Vercel) bloquent le port 25 sortant. L'API Gmail passe par HTTPS, donc fonctionne partout.
- **Voir** : `backend/services/emailService.js`.

## 🎨 Frontend

### Next.js 16 (App Router)

- **Quoi** : Framework React avec rendu côté serveur, routing par fichier, et un nouveau modèle « App Router ».
- **Pourquoi** : Excellent pour le SEO (rendu serveur), bon développement DX (hot reload, layouts imbriqués), et ses **rewrites** permettent de proxifier `/api/*` vers le backend (ce qui rend les cookies first-party).
- **Voir** : `frontend/next.config.mjs` pour le rewrite, et `frontend/app/` pour la structure.

### React 19

- **Quoi** : Bibliothèque UI à composants.
- **Pourquoi** : Standard de fait pour les SPA modernes, et requis par Next.js.

### TypeScript

- **Quoi** : JavaScript typé.
- **Pourquoi** : Détecte les erreurs avant l'exécution. Les types des objets métier (User, Product, Order, etc.) sont définis dans `frontend/src/types/index.ts`.

### Tailwind CSS v4

- **Quoi** : Framework CSS utility-first.
- **Pourquoi** : Permet de styliser rapidement sans écrire de CSS dédié. La v4 utilise une nouvelle syntaxe avec variables CSS personnalisées définies dans `frontend/app/globals.css`.

### shadcn/ui + Radix UI

- **Quoi** : Collection de composants React accessibles (Radix) + une couche de style Tailwind (shadcn).
- **Pourquoi** : On évite de réinventer les Dialog, Dropdown, Select, etc. Ces composants sont copiés-collés dans `frontend/src/components/ui/` pour pouvoir être customisés.
- **Important** : ces composants ne sont PAS des dépendances classiques. Ils font partie du projet, mais on ne touche pas leur API — seulement leur style.

### TanStack Query (React Query) v5

- **Quoi** : Bibliothèque de gestion d'état serveur côté client (cache, refetch, mutations).
- **Pourquoi** : Avant React Query, chaque composant gérait son propre `useState + useEffect + fetch`. Avec React Query, les données sont mises en cache automatiquement, les hooks sont réutilisables, et les mutations sont synchronisées avec le cache (invalidation, optimistic updates).
- **Voir** : `frontend/src/hooks/useApi.ts` (tous les hooks `useProducts`, `useCart`, etc.) et `frontend/src/hooks/useCart.ts` (gestion optimiste avec rollback).

### Sonner (toasts)

- **Quoi** : Bibliothèque de notifications toast.
- **Pourquoi** : Affiche les messages de succès / erreur en haut de l'écran de manière non-bloquante. Utilisé partout où un message utilisateur est nécessaire.

### Lucide React

- **Quoi** : Bibliothèque d'icônes (fork de Feather).
- **Pourquoi** : Icônes vectorielles cohérentes et légères. Utilisées partout (Navbar, sidebar, boutons, etc.).

### React Hook Form + Zod

- **Quoi** : Gestion de formulaires (react-hook-form) avec validation par schéma (zod).
- **Pourquoi** : Performant (pas de re-renders inutiles) et expressif pour les règles de validation.

## 🌐 Hosting & déploiement (mentionné dans le code)

### Vercel (frontend)

- Le frontend est conçu pour être hébergé sur Vercel. Les redirections `/api/*` permettent au cookie de session d'être first-party sur le domaine Vercel.

### Railway (backend, présumé)

- D'après les commentaires dans le code (`backend/auth.js`), le backend est hébergé sur Railway. La configuration `baseURL` de Better Auth gère le cas du proxy `x-forwarded-host` pour rester compatible.

## 📋 Versions principales (extrait du `package.json`)

| Dépendance | Version | Rôle |
|------------|---------|------|
| `express` | ^5.2.1 | Serveur HTTP backend |
| `mongoose` | ^9.2.1 | ORM MongoDB |
| `better-auth` | ^1.5.6 | Authentification |
| `cloudinary` | ^2.9.0 | Stockage images |
| `multer` | ^2.1.1 | Upload de fichiers |
| `googleapis` | ^171.4.0 | API Gmail (e-mails) |
| `next` | ^16.2.3 | Framework frontend |
| `react` | 19.2.4 | UI |
| `@tanstack/react-query` | ^5.62.0 | Cache client |
| `tailwindcss` | ^4.2.0 | CSS utility-first |
| `typescript` | 5.7.3 | Typage |
| `zod` | ^3.24.1 | Validation de schéma |

## ⚠️ Choix techniques surprenants à connaître

### 1. Deux clients MongoDB

Le backend ouvre **deux connexions** à MongoDB :

- **Mongoose** (via `connectDB`) — pour toutes les collections applicatives (Shop, Product, Cart, Order, ClientAddress, Variant).
- **MongoClient natif** (dans `auth.js`) — uniquement pour Better Auth.

C'est nécessaire parce que Better Auth utilise son propre adaptateur (`@better-auth/mongodb-adapter`) qui ne sait pas dialoguer avec Mongoose. Les deux clients pointent vers la même base, donc le modèle Mongoose `User` peut lire les documents écrits par Better Auth.

### 2. Cookie de session first-party

Tous les appels `/api/*` du frontend passent par les **rewrites Next.js** (voir `frontend/next.config.mjs`). Pourquoi ? Si le frontend appelait directement le backend (par exemple `fetch('https://api.example.com/...')`), le cookie de session serait considéré comme **third-party** et bloqué par les navigateurs modernes (Brave, Chrome avec 3PCD activé). Le rewrite résout ça en faisant croire au navigateur que tout vient du même domaine.

### 3. Le panier est toujours côté serveur

Il n'y a **pas de panier invité** : seuls les utilisateurs connectés peuvent ajouter au panier. Le panier est stocké en base (`Cart`), pas en localStorage. C'est plus simple à maintenir (pas de logique de fusion panier invité ↔ panier connecté) mais ça force l'utilisateur à se connecter avant d'ajouter au panier.

### 4. Découpage des commandes par boutique

Quand un acheteur passe une commande qui contient des produits de plusieurs boutiques, **une seule commande globale** (`Order`) est créée, mais elle contient **N sous-commandes** (une par boutique). Chaque vendeur ne voit que la sous-commande qui le concerne. Voir `backend/services/orderService.js` → fonction `createOrder` pour le détail.

### 5. Les produits ont obligatoirement des variantes

Même un produit « simple » (sans déclinaison de taille/couleur) a une variante par défaut appelée `"Standard"`. C'est ce qui permet d'unifier le code : pas de cas particulier `prix` / `stock` au niveau du produit, tout est sur les variantes. Voir `backend/services/productService.js` → fonction `createProduct`.

### 6. Le stock public est masqué

Les acheteurs ne voient **jamais** le nombre exact d'articles en stock. Le backend remplace `stock: 17` par :
- `inStock: true/false`
- `lowStock: true/false`
- `maxPurchasable: min(stock, maxPerOrder)` — la quantité max que l'acheteur peut mettre dans le panier

C'est une décision business (on ne veut pas révéler aux concurrents combien on a en stock). Voir `backend/services/productService.js` → fonction `toPublicVariant`.
