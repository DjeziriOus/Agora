# Documentation interne — Projet AGORA

> Marketplace multi-vendeurs (acheteurs / vendeurs) — Next.js + Express + MongoDB + Better Auth.

Cette documentation interne a pour but de **faciliter la maintenance de l'application par un tiers**.
Elle complète la documentation auto-générée (JSDoc et Swagger) par une analyse manuelle qui décrit
chaque module en mots simples : son rôle, ses dépendances, ses types, ses fonctions exposées,
et les points difficiles à comprendre dans le code.

---

## 📚 Comment lire cette documentation

La doc est organisée en trois couches qui se complètent :

| Couche | Où la trouver | À quoi ça sert |
|--------|---------------|----------------|
| **1. Analyse manuelle** (ce dossier `docs/`) | `docs/*.md` | Comprendre *pourquoi* et *comment* le projet est organisé |
| **2. JSDoc / TypeScript** | Directement dans les fichiers `.js` / `.ts` / `.tsx` | Comprendre *ce que* chaque fonction fait |
| **3. Swagger** | `GET /api/docs` sur le backend en marche | Tester et explorer les routes HTTP |

Quelqu'un qui découvre le projet pour la première fois doit lire dans cet ordre :

1. [`01-architecture-generale.md`](01-architecture-generale.md) — la vue d'ensemble
2. [`02-stack-technique.md`](02-stack-technique.md) — les technos et pourquoi
3. [`03-modele-de-donnees.md`](03-modele-de-donnees.md) — les collections MongoDB
4. [`04-flux-authentification.md`](04-flux-authentification.md) — comment l'authentification fonctionne
5. [`05-flux-panier-commande.md`](05-flux-panier-commande.md) — du panier à la confirmation
6. [`06-flux-vendeur.md`](06-flux-vendeur.md) — création boutique / produits / commandes
7. [`api-swagger.md`](api-swagger.md) — comment lancer Swagger
8. Puis les fiches modules au besoin

---

## 🗂️ Plan complet du dossier `docs/`

### Vue d'ensemble

- [`01-architecture-generale.md`](01-architecture-generale.md)
- [`02-stack-technique.md`](02-stack-technique.md)
- [`03-modele-de-donnees.md`](03-modele-de-donnees.md)
- [`04-flux-authentification.md`](04-flux-authentification.md)
- [`05-flux-panier-commande.md`](05-flux-panier-commande.md)
- [`06-flux-vendeur.md`](06-flux-vendeur.md)
- [`api-swagger.md`](api-swagger.md)

### Modules backend (`docs/modules/backend/`)

#### Point d'entrée et configuration

- [`server.md`](modules/backend/server.md) — Point d'entrée Express
- [`auth.md`](modules/backend/auth.md) — Configuration Better Auth
- [`config-db.md`](modules/backend/config-db.md) — Connexion MongoDB
- [`config-cloudinary.md`](modules/backend/config-cloudinary.md) — Stockage images

#### Middleware

- [`middleware-auth.md`](modules/backend/middleware-auth.md) — Vérification de session + rôles
- [`middleware-upload.md`](modules/backend/middleware-upload.md) — Réception des fichiers
- [`middleware-rateLimiter.md`](modules/backend/middleware-rateLimiter.md) — Limite de débit

#### Routes HTTP

- [`routes-authRoutes.md`](modules/backend/routes-authRoutes.md) — Profil et compte
- [`routes-shopRoutes.md`](modules/backend/routes-shopRoutes.md) — Boutiques
- [`routes-productRoutes.md`](modules/backend/routes-productRoutes.md) — Produits
- [`routes-cartRoutes.md`](modules/backend/routes-cartRoutes.md) — Panier
- [`routes-orderRoutes.md`](modules/backend/routes-orderRoutes.md) — Commandes
- [`routes-clientAddressRoutes.md`](modules/backend/routes-clientAddressRoutes.md) — Adresses

#### Contrôleurs

- [`controllers-authController.md`](modules/backend/controllers-authController.md)
- [`controllers-shopController.md`](modules/backend/controllers-shopController.md)
- [`controllers-productController.md`](modules/backend/controllers-productController.md)
- [`controllers-cartController.md`](modules/backend/controllers-cartController.md)
- [`controllers-clientAddressController.md`](modules/backend/controllers-clientAddressController.md)

#### Services (logique métier)

- [`services-authService.md`](modules/backend/services-authService.md)
- [`services-shopService.md`](modules/backend/services-shopService.md)
- [`services-productService.md`](modules/backend/services-productService.md)
- [`services-variantService.md`](modules/backend/services-variantService.md)
- [`services-cartService.md`](modules/backend/services-cartService.md)
- [`services-orderService.md`](modules/backend/services-orderService.md)
- [`services-clientAddressService.md`](modules/backend/services-clientAddressService.md)
- [`services-emailService.md`](modules/backend/services-emailService.md)
- [`services-emailTemplates.md`](modules/backend/services-emailTemplates.md)
- [`services-accountDeletionService.md`](modules/backend/services-accountDeletionService.md)

#### Modèles Mongoose

- [`models-User.md`](modules/backend/models-User.md)
- [`models-Shop.md`](modules/backend/models-Shop.md)
- [`models-Product.md`](modules/backend/models-Product.md)
- [`models-Variant.md`](modules/backend/models-Variant.md)
- [`models-Cart.md`](modules/backend/models-Cart.md)
- [`models-Order.md`](modules/backend/models-Order.md)
- [`models-ClientAddress.md`](modules/backend/models-ClientAddress.md)

#### Scripts (migrations + seed)

- [`scripts.md`](modules/backend/scripts.md)

### Modules frontend (`docs/modules/frontend/`)

#### Pages Next.js

- [`app-auth.md`](modules/frontend/app-auth.md) — Pages d'authentification (`/login`, `/register`, etc.)
- [`app-client.md`](modules/frontend/app-client.md) — Pages côté acheteur
- [`app-vendeur.md`](modules/frontend/app-vendeur.md) — Pages côté vendeur

#### Contextes React (état global)

- [`context-AuthContext.md`](modules/frontend/context-AuthContext.md)
- [`context-CartContext.md`](modules/frontend/context-CartContext.md)

#### Hooks personnalisés

- [`hooks.md`](modules/frontend/hooks.md)

#### Bibliothèques utilitaires

- [`lib-api.md`](modules/frontend/lib-api.md) — Client API HTTP
- [`lib-auth-client.md`](modules/frontend/lib-auth-client.md) — Client Better Auth
- [`lib-other.md`](modules/frontend/lib-other.md) — Helpers divers

#### Composants

- [`components-metier.md`](modules/frontend/components-metier.md) — Composants métier (Navbar, ProductCard, etc.)
- [`components-ui.md`](modules/frontend/components-ui.md) — Wrappers shadcn/Radix (mention collective)

---

## 📐 Structure d'une fiche module

Chaque fiche module suit **exactement** la structure demandée par le professeur :

```markdown
# Module : <nom du fichier>

## 1. Objectifs du module
(2-4 phrases simples : à quoi il sert dans l'application)

## 2. Relations d'utilisation
### Modules utilisés par ce module (dépendances sortantes)
- liste des imports importants
### Modules qui utilisent ce module (dépendances entrantes)
- liste des fichiers qui importent ce module

## 3. Définitions de types / attributs
(types TypeScript, schémas Mongoose, attributs d'objets exposés)

## 4. Procédures externes (visibles depuis l'extérieur)
(fonctions exportées avec leur signature et leur but)

## 5. Variables externes (visibles depuis l'extérieur)
(constantes / objets non-fonction qui sont exportés)

## 6. Notes d'implémentation
(les points difficiles, les pièges, les choix surprenants)
```

---

## 🗒️ Conventions utilisées dans cette documentation

- **Toutes les explications sont en français.**
- Le code lui-même reste en anglais (variables, noms de fichiers) — c'est la norme du projet.
- Quand une fiche mentionne un fichier, le chemin est indiqué depuis la racine du projet
  (ex. : `backend/services/cartService.js`).
- Les routes HTTP sont notées `MÉTHODE /chemin` (ex. : `POST /api/orders`).
- Quand un mot anglais technique est employé (controller, hook, middleware), il est conservé tel quel
  car c'est le terme utilisé partout dans le code.

---

## 🔧 Mise à jour de la documentation

Cette documentation doit être mise à jour quand :

- Un module est créé / supprimé / renommé
- Une route HTTP est ajoutée ou modifiée
- Un schéma de données (modèle Mongoose) change
- Un flux métier (auth, panier, commande) est modifié

Pour la JSDoc et Swagger, la mise à jour se fait directement dans le code (les commentaires sont
co-localisés avec les fonctions et les routes).
