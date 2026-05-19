# Module : `backend/middleware/upload.js`

## 1. Objectifs du module

Configurer `multer` (parseur de `multipart/form-data`) pour les **uploads de fichiers** dans Express.

Définit trois configs distinctes pour les trois cas d'usage du projet :
- Upload de plusieurs images produit
- Upload du logo et de la bannière de boutique
- Upload de la photo de profil utilisateur

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `multer` (npm) — parseur multipart

### Modules qui utilisent ce module

- `backend/routes/productRoutes.js` — `uploadProductImages` sur `POST` et `PUT /api/products`
- `backend/routes/shopRoutes.js` — `uploadShopImages` sur `POST` et `PUT /api/shops`
- `backend/routes/authRoutes.js` — `uploadAvatar` sur `PUT /api/account/profile-picture`

## 3. Définitions de types / attributs

### Limites par type d'upload

| Middleware | Champ form | Max fichiers | Max taille / fichier |
|------------|-----------|--------------|----------------------|
| `uploadProductImages` | `images` | 5 | 5 Mo |
| `uploadShopImages` | `logo`, `banner` | 1 chacun (2 au total) | 15 Mo |
| `uploadAvatar` | `avatar` | 1 | 5 Mo |

### Types MIME acceptés

```js
["image/jpeg", "image/png", "image/webp"]
```

Tout autre type est rejeté avec une erreur claire (« Type de fichier non supporté. Utilisez JPEG, PNG ou WebP. »).

## 4. Procédures externes

| Export | Type | Rôle |
|--------|------|------|
| `uploadProductImages` | `Middleware` | Parse jusqu'à 5 images sur le champ `images` |
| `uploadShopImages` | `Middleware` | Parse `logo` (1) + `banner` (1) |
| `uploadAvatar` | `Middleware` | Parse 1 fichier sur le champ `avatar` |

Chaque middleware lit `req` et :
- Si OK : remplit `req.files` (array ou objet selon le cas) avec `{ buffer, mimetype, originalname, size }`.
- Si erreur : appelle `next(err)` avec une `MulterError` ou l'erreur de `fileFilter`.

## 5. Variables externes

Aucune.

## 6. Notes d'implémentation

### `memoryStorage` au lieu de `diskStorage`

```js
const storage = multer.memoryStorage();
```

Les fichiers uploadés sont gardés en **RAM** (buffer) au lieu d'être écrits sur disque. Avantages :
- Pas de fichier temporaire à nettoyer.
- Le buffer est directement transmis à Cloudinary via `upload_stream`.
- Pas besoin de droits d'écriture sur le filesystem (utile sur des hébergeurs read-only comme certaines plateformes serverless).

Inconvénient : pour de très gros fichiers (vidéos, GB+), ça surcharge la mémoire du serveur. Ici les limites sont 5-15 Mo, donc pas de problème.

### Différences entre `array`, `fields`, `single`

- `productUpload.array("images", 5)` — accepte plusieurs fichiers sur UN SEUL champ (`images`).
- `shopUpload.fields([{ name: "logo", maxCount: 1 }, { name: "banner", maxCount: 1 }])` — accepte DIFFÉRENTS champs (`logo`, `banner`), chacun avec sa propre limite. Le résultat est `req.files.logo[0]` et `req.files.banner[0]`.
- `avatarUpload.single("avatar")` — UN fichier sur UN champ. Le résultat est `req.file` (pas `req.files`).

### Erreurs renvoyées dans la réponse

Multer convertit ses erreurs en `MulterError` standard. Si Express n'a pas de handler d'erreur, ces erreurs sont renvoyées en 500. C'est pourquoi les contrôleurs vérifient `req.file` / `req.files` et renvoient un 400 explicite s'il manque.

### Le pré-traitement

Multer ne redimensionne PAS les images. Il les passe telles quelles (avec les limites de taille). Le redimensionnement est fait par Cloudinary à l'upload (voir `config/cloudinary.js`).
