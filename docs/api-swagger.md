# Documentation Swagger — référence des routes HTTP

Toutes les routes HTTP du backend sont documentées avec **Swagger / OpenAPI 3** directement dans
le code source. La documentation est générée à la volée et exposée sur deux URLs :

- **UI interactive** : `GET /api/docs` (interface Swagger UI)
- **Spec JSON brute** : `GET /api/docs.json` (pour import dans Postman, Insomnia, etc.)

## 🚀 Comment y accéder

1. Démarre le backend :

```bash
cd backend
npm run dev
```

2. Ouvre dans ton navigateur :

```
http://localhost:5001/api/docs
```

Tu verras toutes les routes triées par tag (`Auth`, `Shops`, `Products`, etc.) avec :
- Le verbe HTTP et le chemin
- Les paramètres attendus (path, query, body)
- Les réponses possibles avec leurs codes HTTP
- Un bouton "Try it out" pour tester depuis l'UI

## 📐 Comment c'est généré

Le code utilise `swagger-jsdoc` qui parse les commentaires JSDoc spéciaux placés au-dessus des
routes. Exemple :

```js
/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Récupère le panier de l'utilisateur connecté
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Panier de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.get("/", getMyCart);
```

Au démarrage du serveur, `swagger-jsdoc` lit tous les fichiers `routes/*.js` et `models/*.js`,
extrait ces blocs, et génère un objet OpenAPI 3 que `swagger-ui-express` sert sur `/api/docs`.

## 🔑 Authentification dans Swagger UI

Beaucoup de routes nécessitent un cookie de session Better Auth. Pour tester depuis Swagger UI :

1. Connecte-toi d'abord à l'application (via `/login` sur le frontend ou via `POST /api/auth/sign-in/email` depuis Swagger).
2. Le cookie est posé automatiquement par le navigateur.
3. Toute requête « Try it out » dans Swagger UI envoie le cookie avec.

**Note** : les routes `/api/auth/*` sont gérées par Better Auth (catch-all), pas par notre code applicatif. Elles ne sont pas documentées dans Swagger — leur doc complète se trouve sur le site officiel de Better Auth.

## 🏷️ Les tags (groupes de routes)

| Tag | Routes | Auth |
|-----|--------|------|
| **Account** | `/api/account/*` | Mixte |
| **Shops** | `/api/shops/*` | Mixte (publiques + seller) |
| **Products** | `/api/products/*` | Mixte (publiques + seller) |
| **Cart** | `/api/cart/*` | buyer |
| **Orders** | `/api/orders/*` | Mixte (buyer + seller) |
| **Addresses** | `/api/addresses/*` | buyer |

## 📋 Schémas définis

Les schémas réutilisables sont définis dans les modèles Mongoose (`backend/models/*.js`). Ils incluent :

- `User` — profil utilisateur
- `Shop` — boutique
- `Product` — produit (avec variantes embarquées)
- `Variant` — variante de produit
- `Cart` — panier
- `CartItem` — item du panier
- `Order` — commande globale
- `SubOrder` — sous-commande par boutique
- `ClientAddress` — adresse acheteur
- `Error` — format d'erreur standard

## ⚙️ Modifier la doc Swagger

Pour ajouter une route documentée :

1. Ouvre le fichier `backend/routes/<feature>Routes.js`.
2. Au-dessus de la route, ajoute un bloc JSDoc avec `@swagger` :

```js
/**
 * @swagger
 * /api/<chemin>:
 *   post:
 *     tags: [<Tag>]
 *     summary: <Description courte>
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom: { type: string }
 *     responses:
 *       200:
 *         description: Succès
 */
router.post("/<chemin>", controllerFunction);
```

3. Sauvegarde — la doc est régénérée à chaque démarrage du serveur. Pas besoin de build step.

## 🔍 Erreurs courantes Swagger

| Problème | Cause typique |
|----------|---------------|
| « unable to render » dans Swagger UI | YAML mal indenté dans le bloc JSDoc — vérifier les espaces |
| Route absente alors qu'elle est codée | Le commentaire `@swagger` n'a pas été ajouté |
| Schéma `$ref` cassé | Le nom du schéma référencé n'existe pas (vérifier `components.schemas`) |
| Toutes les routes en 401 dans « Try it out » | Pas de cookie de session — se connecter d'abord |

## 📦 Export vers Postman

L'export Postman se fait via :

```bash
curl http://localhost:5001/api/docs.json > agora-api.json
```

Puis dans Postman : Import → choisir `agora-api.json` → l'outil crée automatiquement une collection.

> Le projet contient déjà une collection Postman maintenue à la main dans `backend/postman/`.
> Les deux sources peuvent diverger ; la collection Postman est historique et la doc Swagger est
> la nouvelle source de vérité.
