# Flux vendeur — création boutique, produits, stock

Ce document décrit le parcours complet d'un compte vendeur : depuis l'inscription jusqu'à la
gestion quotidienne de sa boutique.

## 🎯 Vue d'ensemble

```
   1. Inscription en tant que vendeur (role = "seller")
      │
      ▼
   2. Vérification d'email (si activée)
      │
      ▼
   3. Création de boutique sur /vendeur/boutique
      │
      │ Nom, description, contact, logo, bannière
      │
      ▼
   4. Création de produits sur /vendeur/produits/nouveau
      │
      │ Pour chaque produit :
      │  - Nom, description, catégorie
      │  - Images (≥ 1)
      │  - Une ou plusieurs variantes (taille, couleur, etc.)
      │  - Pour chaque variante : prix, stock, maxPerOrder
      │
      ▼
   5. Gestion quotidienne :
      - Vue Dashboard : statistiques (CA, commandes en attente, stock bas)
      - Vue Commandes : liste des sous-commandes
      - Vue Stock : alertes stock bas
      - Édition de produits, désactivation, suppression
```

## 🏪 Étape 3 : Création de la boutique

### Côté frontend

Page `/vendeur/boutique/page.tsx` :
- Formulaire avec champs : nom, description, contact (email, phone, address), logo, bannière.
- Logo et bannière sont uploadés en tant que `FormData` (multipart).
- Appelle `shopsApi.create(formData)` qui fait un `POST /api/shops`.

### Côté backend

`POST /api/shops` → middleware `verifyToken + isSeller + uploadShopImages` → `shopController.createShop` → `shopService.createShop`.

**Vérifications effectuées** :
1. Si `REQUIRE_EMAIL_VERIFICATION` est actif et que l'email n'est pas vérifié → 403.
2. Si le vendeur a déjà une boutique non-supprimée → 409 (Conflict).
3. Si le nom de boutique existe déjà → 409.

**Actions effectuées** :
1. Upload du logo sur Cloudinary (preset `shopLogo` → 400×400 WebP).
2. Upload de la bannière sur Cloudinary (preset `shopBanner` → 1600×500 WebP).
3. Création du document `Shop` avec `slug` auto-généré.

### Cas particulier : édition vs création

Le bouton « Boutique » dans le sidebar vendeur amène toujours sur `/vendeur/boutique`.
La page détecte si une boutique existe :
- Pas de boutique → affiche le formulaire de création.
- Boutique existante → affiche le formulaire d'édition (avec valeurs pré-remplies).

## 📦 Étape 4 : Création de produits

### Modèle produit + variantes

**Important** : un produit est lié à 1..N variantes. Même les produits simples ont une variante.

Exemples :

| Type | Produit | Variantes |
|------|---------|-----------|
| Simple (un seul prix) | "Stylo bille" | 1 variante "Standard" |
| Multiple | "T-shirt logo" | 3 variantes : "Taille S", "Taille M", "Taille L" |
| Avec attributs | "Robe Lily" | 6 variantes : combinaisons taille × couleur |

### Côté frontend

Page `/vendeur/produits/nouveau/page.tsx` :

Formulaire en plusieurs sections :
- Infos générales : nom, description, catégorie.
- Images (upload multiple, max 5, 5 Mo chacune).
- Variantes : tableau dynamique où on ajoute des lignes. Pour chaque ligne :
  - Code (interne, unique par produit)
  - Nom (affiché à l'acheteur, ex "Taille M")
  - SKU (optionnel)
  - Prix (€)
  - Stock (entier)
  - Max par commande (défaut 10)
  - Attributs libres (clé:valeur)
- Bouton "Créer" → POST `multipart/form-data` à `/api/products`.

Les variantes sont envoyées sous forme de **JSON stringifié** dans un champ `variants` du FormData.
Pourquoi ? Parce que FormData ne supporte pas nativement les structures imbriquées.

### Côté backend

`POST /api/products` → middleware `verifyToken + isSeller + uploadProductImages` → `productController.createProduct` → `productService.createProduct`.

**Logique** :
1. Vérifie qu'au moins 1 image est fournie.
2. Récupère la boutique du vendeur.
3. Parse `body.variants` (JSON stringifié). Si vide, crée une variante par défaut à partir de `body.price` et `body.stock`.
4. Valide chaque variante (code, nom, prix).
5. Upload chaque image sur Cloudinary (ou fallback placehold.co en dev).
6. Crée le `Product`.
7. Crée les `Variant`s liées en bulk avec `Variant.insertMany`.

## 📝 Édition de produit

`PUT /api/products/:id` → `productService.updateProduct`.

Cas plus complexe à cause des images :

### Gestion des images

Le frontend envoie deux choses :
- `keepImages` : un JSON array des `publicId` des images existantes à **garder**.
- `images` (fichiers) : les nouvelles images à ajouter.

Le service :
1. Filtre les images existantes en deux groupes : à garder vs à supprimer.
2. Upload les nouvelles images.
3. Concatène : `finalImages = imagesToKeep + newImages`.
4. Vérifie qu'il en reste au moins 1.
5. Met à jour le `Product`.
6. Supprime de Cloudinary (fire-and-forget) les images retirées.

### Gestion des variantes (upsert)

Si `body.variants` est fourni, le service appelle `variantService.updateVariantsForProduct(productId, variantsArray)` qui :
- Trouve toutes les variantes existantes du produit.
- Pour chaque variante du payload avec un `id` → **update**.
- Pour chaque variante du payload sans `id` → **create**.
- Toute variante existante non présente dans le payload → **delete**.

C'est un pattern « replace all » pratique pour le formulaire d'édition.

## 🗑️ Suppression de produit

`DELETE /api/products/:id` → `productService.deleteProduct`.

1. **Soft delete** : `product.isDeleted = true`.
2. Toutes les variantes du produit : `isActive: false`.
3. Toutes les images Cloudinary du produit : supprimées (fire-and-forget).

Le produit n'apparaît plus :
- Dans le catalogue public (filtré sur `isDeleted: false, isActive: true`).
- Dans les listings vendeur.

**Mais** :
- Les anciennes commandes contiennent toujours les snapshots (nom, image, prix) du produit.

## 📊 Étape 5 : Dashboard vendeur

### Statistiques globales

`GET /api/shops/my/stats` → `shopService.getVendorStats(sellerId)` retourne :
- `totalRevenue` : somme des `subOrder.total` pour ce vendeur (toutes commandes confondues).
- `totalOrders` : nombre de sous-commandes.
- `pendingOrders` : sous-commandes en statut `en_attente`.
- `totalProducts`, `activeProducts` : compteurs de produits.
- `averageRating` : note moyenne de la boutique (pas implémenté actuellement, retourne `shop.rating || 0`).

### Statistiques de stock

`GET /api/shops/my/stock-stats` → `shopService.getStockStats(sellerId)` retourne :
- `inStockCount` : nombre de variantes en stock normal.
- `lowStockCount` : nombre de variantes sous le seuil (≤ `stockThreshold`).
- `outOfStockCount` : nombre de variantes à 0.

Utilisé dans le dashboard pour afficher des alertes visuelles.

### Page `/vendeur/stock`

Liste les produits avec **stock bas** (`?lowStock=true` sur `/api/products/mine`).
Permet une vue rapide des références à recharger.

### Page `/vendeur/produits`

Tableau paginé avec recherche, filtres (actif/inactif, stock bas), tri par date.
Pour chaque ligne, actions : Éditer, Activer/Désactiver, Supprimer.

#### Désactivation (vs suppression)

- **Désactivation** (`PUT /api/products/:id { isActive: false }`) : le produit est conservé mais n'apparaît plus dans le catalogue public. Utile pour les produits saisonniers, en rupture, etc.
- **Suppression** (`DELETE /api/products/:id`) : soft delete définitif.

## 🚚 Gestion des commandes vendeur

### Page `/vendeur/commandes`

Liste de toutes les sous-commandes qui concernent ce vendeur, triées par date.

Pour chaque sous-commande :
- N° (les 8 derniers caractères de l'`Order._id`)
- Date
- Total
- Statut actuel
- Click → page de détail

### Page `/vendeur/commandes/[id]`

Détail d'une sous-commande :
- Articles avec quantités et prix
- Adresse de livraison (figée au moment de la commande)
- Coordonnées de l'acheteur
- Sélecteur de statut → change le statut via `PATCH /api/orders/:id/status`.

## 🔒 Sécurité côté vendeur

Tous les endpoints vendeur passent par `verifyToken + isSeller`. En plus, chaque endpoint vérifie
l'ownership (le vendeur ne peut accéder qu'à SA boutique, SES produits, SES sous-commandes) :

- Boutique : `shop.owner === currentUser.id`
- Produit : `product.shop === currentUser.shop._id`
- Sous-commande : `subOrder.sellerId === currentUser.id`

Si la vérification échoue, c'est un 403 (ou 404 selon l'endpoint, pour ne pas révéler l'existence).

## 📸 Particularités liées aux images

### Pourquoi un `publicId` ?

Cloudinary identifie chaque image par un `publicId` (ex : `agora/products/abc123xyz`). On stocke
cet ID en base à côté de l'URL pour pouvoir :
- Supprimer l'image quand le produit est supprimé.
- Remplacer l'image lors d'une édition.

Sans le publicId, on aurait des images orphelines qui consomment du stockage Cloudinary.

### Transformations automatiques

Le fichier `backend/config/cloudinary.js` définit des **presets** qui transforment les images
avant stockage :

| Preset | Dimensions | Format |
|--------|-----------|--------|
| `product` | max 1200×1200 | webp, quality auto |
| `shopLogo` | max 400×400 | webp |
| `shopBanner` | max 1600×500 | webp |
| `avatar` | 400×400 (crop face) | webp |

L'image originale est **redimensionnée AVANT stockage**. C'est important : sans ça, on paierait
des transformations à la volée à chaque chargement.

## 🛠️ Maintenance — points d'attention

### 1. La création de variante par défaut

Quand un vendeur crée un produit "simple" (champ `variants` vide ou absent), le backend génère
automatiquement une variante `"Standard"` avec `code: "default"` et le prix/stock du formulaire.

**Conséquence pour l'édition** : si plus tard le vendeur veut ajouter des déclinaisons (taille, etc.),
il doit modifier cette variante par défaut ET en ajouter de nouvelles. Le frontend gère ça via le
tableau dynamique des variantes.

### 2. Variant code unique par produit

Deux variantes d'un même produit ne peuvent pas avoir le même `code`. C'est protégé par un index
unique `{ product: 1, code: 1 }`. Si le vendeur essaie, Mongo renvoie une erreur E11000 que le
backend traduit en message utilisateur.

### 3. Ordre de validation produit ↔ variantes

Lors de la création :
1. D'abord on valide TOUTES les variantes (sinon on créerait un produit orphelin si une variante échoue).
2. Puis on upload les images (sinon on aurait des fichiers Cloudinary orphelins).
3. Puis on crée le produit.
4. Puis on crée les variantes.

Si une étape échoue après les uploads Cloudinary, **les fichiers ne sont pas nettoyés**. C'est un point
à améliorer en cas de bug (gestion de rollback complète).

### 4. Re-création d'une boutique après suppression

Les indexes uniques sur `Shop.owner`, `Shop.name`, `Shop.slug` sont **partiels** : ils ne s'appliquent
qu'aux documents `isDeleted: false`. Donc un vendeur peut supprimer sa boutique, puis en créer une
nouvelle avec un nom différent (ou même le même nom, comme s'il n'y avait jamais eu d'ancien shop).

### 5. Le format des prix

Tous les prix sont stockés en **euros avec décimales** (`Number`), pas en centimes. Si on intègre
un paiement réel (Stripe, etc.), il faudra convertir en centimes au moment de l'appel API du provider.

## 🔄 Tableau récapitulatif des routes vendeur

| Route | Méthode | Auth | But |
|-------|---------|------|-----|
| `/api/shops` | POST | seller | Crée la boutique |
| `/api/shops/:id` | PUT | seller | Modifie la boutique |
| `/api/shops/my` | GET | seller | Récupère la boutique du vendeur |
| `/api/shops/my/stats` | GET | seller | Stats CA, commandes |
| `/api/shops/my/stock-stats` | GET | seller | Stats stock |
| `/api/products` | POST | seller | Crée un produit |
| `/api/products/:id` | PUT | seller | Modifie un produit |
| `/api/products/:id` | DELETE | seller | Soft-delete un produit |
| `/api/products/mine` | GET | seller | Liste les produits du vendeur |
| `/api/products/mine/:id` | GET | seller | Détail produit pour édition |
| `/api/orders/seller` | GET | seller | Liste des sous-commandes |
| `/api/orders/seller/:id` | GET | seller | Détail d'une sous-commande |
| `/api/orders/:id/status` | PATCH | seller | Change le statut |
