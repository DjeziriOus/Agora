# Architecture générale du projet AGORA

## 🎯 Qu'est-ce qu'AGORA ?

AGORA est une **marketplace en ligne multi-vendeurs**. Concrètement, c'est un site qui permet :

- À des **acheteurs** (rôle `buyer`) de parcourir des produits, les ajouter à un panier, passer commande.
- À des **vendeurs** (rôle `seller`) de créer leur boutique, mettre des produits en vente, gérer leur stock et leurs commandes.

Un même utilisateur **ne peut pas** être à la fois acheteur et vendeur : le rôle est choisi à l'inscription et conditionne tout l'accès au site.

## 🏗️ Vue d'ensemble en deux blocs

Le projet est physiquement séparé en deux dossiers :

```
Agora/
├── backend/        ← serveur Node.js + Express (API)
├── frontend/       ← application Next.js (site web)
└── docs/           ← cette documentation
```

Le **frontend** parle au **backend** uniquement via HTTP (REST), sur des routes `/api/*`.
La base de données **MongoDB** n'est jamais accédée directement par le frontend.

```
   ┌──────────────────┐    HTTP (JSON / FormData)    ┌──────────────────┐    Mongoose    ┌──────────────────┐
   │                  │  ────────────────────────►   │                  │  ───────────►  │                  │
   │  Frontend Next   │                              │  Backend Express │                │     MongoDB      │
   │  (port 3000)     │  ◄────────────────────────   │  (port 5001)     │  ◄───────────  │                  │
   │                  │                              │                  │                │                  │
   └──────────────────┘                              └──────────────────┘                └──────────────────┘
            │                                                  │
            │                                                  ├──► Cloudinary (images)
            │                                                  └──► Gmail API (emails)
            ▼
   Navigateur de l'utilisateur
```

## 🎭 Les trois domaines fonctionnels (F1, F2, F3)

Le projet est conçu autour de **trois blocs métier**, comme indiqué dans la spec et le README :

### F1 — Authentification et contrôle d'accès

- Inscription acheteur / vendeur
- Connexion email + mot de passe ou Google
- Vérification d'email
- Choix de rôle à la première connexion
- Session partagée entre le frontend et le backend (cookie HTTP)
- Routes protégées selon le rôle

**Fichiers clés** :
- `backend/auth.js` — configuration Better Auth
- `backend/middleware/auth.js` — `verifyToken`, `isSeller`, `isBuyer`
- `frontend/src/context/AuthContext.tsx` — état global utilisateur
- `frontend/src/lib/auth-client.ts` — client Better Auth

### F2 — Catalogue, boutiques, produits, panier

- Création + édition de boutique (logo + bannière)
- Création + édition de produit avec **variantes** (taille, couleur, etc.)
- Upload des images sur Cloudinary
- Catalogue public + page de boutique + page produit
- Recherche et filtres
- Panier persistant côté serveur

**Fichiers clés** :
- `backend/services/shopService.js`
- `backend/services/productService.js`
- `backend/services/variantService.js`
- `backend/services/cartService.js`
- `frontend/app/(client)/catalogue/`
- `frontend/app/(client)/produit/[id]/`
- `frontend/app/(client)/panier/`

### F3 — Commandes (acheteur + vendeur)

- Tunnel de commande (panier → adresse → confirmation)
- Création de commande avec **découpage par boutique** (sous-commandes)
- Historique des commandes côté acheteur
- Liste des commandes côté vendeur
- Mise à jour du statut par le vendeur (en attente, en préparation, expédiée, livrée, annulée)
- E-mails automatiques à chaque étape

**Fichiers clés** :
- `backend/services/orderService.js`
- `backend/models/Order.js`
- `frontend/app/(client)/checkout/`
- `frontend/app/(client)/compte/commandes/`
- `frontend/app/vendeur/commandes/`

## 🧱 Architecture en couches (backend)

Le backend suit l'architecture **routes → contrôleurs → services → modèles** :

```
   HTTP Request
        │
        ▼
   ┌──────────────────┐    "C'est quel chemin URL ? Quelle méthode ?
   │     Routes       │     Quel middleware ?"
   │  (Express)       │     ← backend/routes/*.js
   └──────────────────┘
        │
        ▼
   ┌──────────────────┐    "Lis les paramètres de la requête, appelle un service,
   │   Controllers    │     formate la réponse, gère les erreurs HTTP."
   │                  │     ← backend/controllers/*.js
   └──────────────────┘
        │
        ▼
   ┌──────────────────┐    "Logique métier pure : règles de validation,
   │    Services      │     calculs, orchestration entre modèles."
   │                  │     ← backend/services/*.js
   └──────────────────┘
        │
        ▼
   ┌──────────────────┐    "Définition des collections MongoDB,
   │     Models       │     validation des schémas, indexes."
   │  (Mongoose)      │     ← backend/models/*.js
   └──────────────────┘
        │
        ▼
   MongoDB
```

**Pourquoi cette séparation ?** Parce qu'on peut tester un service sans démarrer Express, et
parce qu'un même service peut être réutilisé par plusieurs contrôleurs (par exemple,
`getAccountDeletionBlockReason` est appelé à la fois par une route HTTP et par un hook Better Auth).

## 🧩 Architecture frontend (Next.js App Router)

Le frontend utilise **Next.js 16** avec l'App Router. La structure est :

```
   frontend/
   ├── app/                       ← Pages (1 dossier = 1 route)
   │   ├── (auth)/                ← Groupe "auth" (sans préfixe URL)
   │   │   ├── login/
   │   │   ├── register/
   │   │   └── ...
   │   ├── (client)/              ← Groupe "client" (acheteur)
   │   │   ├── catalogue/
   │   │   ├── produit/[id]/
   │   │   ├── panier/
   │   │   └── ...
   │   ├── vendeur/               ← Espace vendeur
   │   │   ├── boutique/
   │   │   ├── produits/
   │   │   └── ...
   │   └── layout.tsx             ← Layout racine (fournit AuthProvider, etc.)
   │
   └── src/
       ├── components/            ← Composants React partagés
       │   ├── Navbar.tsx, Footer.tsx, ProductCard.tsx, ...
       │   ├── landing/           ← composants de la landing page
       │   └── ui/                ← wrappers shadcn/Radix (button, dialog, etc.)
       ├── context/               ← AuthContext, CartContext
       ├── hooks/                 ← useApi, useCart, useInView
       ├── lib/                   ← api.ts, auth-client.ts, utils.ts
       └── types/                 ← définitions TypeScript globales
```

### Particularités importantes

1. **Les parenthèses `(auth)` et `(client)`** sont une convention Next.js : elles regroupent
   des pages sous un même layout sans ajouter de segment à l'URL. Donc `app/(auth)/login/page.tsx`
   sert `/login`, pas `/(auth)/login`.

2. **Le dossier `app/vendeur/`** n'est PAS un groupe (pas de parenthèses), donc toutes ses pages
   ont l'URL préfixée par `/vendeur/...`.

3. **Les composants `ui/`** dans `src/components/ui/` viennent de [shadcn/ui](https://ui.shadcn.com)
   et sont des wrappers stylisés autour de [Radix UI](https://www.radix-ui.com). Ils sont gardés
   tels quels — pas de logique métier dedans, juste de la mise en forme + accessibilité.

## 🔐 Flux d'authentification (résumé)

Le détail complet est dans [`04-flux-authentification.md`](04-flux-authentification.md), mais en très court :

1. Better Auth (côté backend, fichier `auth.js`) gère **l'inscription, la connexion, les sessions, OAuth Google, et la vérification d'email**.
2. Sur le backend, toutes les requêtes `/api/auth/*` sont attrapées par un seul handler : `app.all("/api/auth/*splat", toNodeHandler(auth))`.
3. Sur le frontend, on utilise `better-auth/react` (`authClient`) qui parle au backend via les routes `/api/auth/*`.
4. La session est stockée dans un **cookie HTTP first-party** (le navigateur de l'utilisateur le voit comme venant du frontend, pas du backend — c'est ce qui permet à Brave/Chrome de ne pas le bloquer).
5. Le middleware `verifyToken` (`backend/middleware/auth.js`) vérifie ce cookie sur chaque route protégée.

## 🛒 Flux panier → commande (résumé)

Le détail complet est dans [`05-flux-panier-commande.md`](05-flux-panier-commande.md), mais en très court :

1. L'acheteur ajoute des produits au panier (`POST /api/cart/add`).
2. Le panier est **toujours stocké en base** (collection `carts`) — il n'y a pas de panier local.
3. Au checkout, l'acheteur choisit une adresse et confirme.
4. Le service `orderService.createOrder` :
   - Décrémente le stock de chaque variante (de manière atomique, avec rollback en cas d'erreur).
   - Regroupe les articles **par boutique** → 1 commande globale + N sous-commandes.
   - Sauvegarde l'`Order` en base.
   - Envoie un e-mail à l'acheteur + un e-mail à chaque vendeur concerné.
5. Le vendeur voit ses sous-commandes dans `/vendeur/commandes` et peut changer leur statut.

## 🚀 Que se passe-t-il au démarrage ?

```
   $ cd backend && npm run dev
   │
   ├──► dotenv charge .env
   ├──► auth.js connecte un MongoClient direct pour Better Auth
   ├──► server.js connecte mongoose (connectDB)
   ├──► Express monte les middlewares (cors, logger, etc.)
   ├──► Express monte le catch-all Better Auth : /api/auth/*splat
   ├──► Express monte les routes applicatives : /api/shops, /api/products, ...
   └──► Le serveur écoute sur le port 5001

   $ cd frontend && npm run dev
   │
   ├──► Next.js démarre Turbopack
   ├──► next.config.mjs configure le rewrite : /api/* → backend
   └──► Le site est servi sur http://localhost:3000
```

> **Note importante** : en développement, le frontend appelle ses propres URLs `/api/*` (sur `localhost:3000`).
> Next.js les **proxifie** vers le backend (`localhost:5001`). C'est ce qui permet aux cookies de session
> d'être considérés comme « first-party » par le navigateur.

## 📦 Variables d'environnement minimales

Voir le `README.md` à la racine pour la liste complète. En résumé :

**Backend (`backend/.env`)** :
- `MONGO_URI` — URL de la base MongoDB
- `BETTER_AUTH_SECRET` — secret pour signer les sessions
- `BETTER_AUTH_URL` — URL publique du backend
- `FRONTEND_URL` — URL publique du frontend
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth Google
- `GOOGLE_REFRESH_TOKEN` — envoi d'e-mails via l'API Gmail
- `CLOUDINARY_*` — upload d'images

**Frontend (`frontend/.env.local`)** :
- `NEXT_PUBLIC_API_URL` — URL du backend (utilisée pour le proxy SSR uniquement)

## 🗂️ Suite de la lecture

- Pour comprendre les technos et leurs raisons : [`02-stack-technique.md`](02-stack-technique.md)
- Pour voir les schémas de données : [`03-modele-de-donnees.md`](03-modele-de-donnees.md)
- Pour le détail du flux d'auth : [`04-flux-authentification.md`](04-flux-authentification.md)
- Pour le détail du flux commande : [`05-flux-panier-commande.md`](05-flux-panier-commande.md)
- Pour le détail du flux vendeur : [`06-flux-vendeur.md`](06-flux-vendeur.md)
