# Module : `backend/config/cloudinary.js`

## 1. Objectifs du module

Encapsuler **toutes les interactions avec Cloudinary** (service externe de stockage d'images).

Le module fait deux choses :
1. Configure le SDK Cloudinary avec les credentials de l'environnement.
2. Expose 3 fonctions helper : upload, suppression simple, suppression multiple.

## 2. Relations d'utilisation

### Modules utilisés par ce module

- `cloudinary` (npm) — SDK officiel Cloudinary

### Modules qui utilisent ce module

- `backend/services/productService.js` — upload des images produits
- `backend/services/shopService.js` — upload des logos et bannières
- `backend/controllers/authController.js` — upload et suppression de la photo de profil

## 3. Définitions de types / attributs

### Presets d'upload (`UPLOAD_PRESETS`)

Objet interne (non exporté) qui définit les transformations à appliquer à chaque type d'image :

| Preset | Folder | Dimensions max | Format |
|--------|--------|----------------|--------|
| `product` | `agora/products` | 1200×1200 | WebP |
| `shopLogo` | `agora/shops/logos` | 400×400 | WebP |
| `shopBanner` | `agora/shops/banners` | 1600×500 | WebP |
| `avatar` | `agora/avatars` | 400×400 (crop face) | WebP |

### Retour de `uploadToCloudinary`

```ts
{ url: string, publicId: string }
```

- `url` — URL HTTPS publique de l'image (à servir au navigateur)
- `publicId` — identifiant Cloudinary (à stocker pour pouvoir supprimer l'image plus tard)

## 4. Procédures externes

| Fonction | Signature | Rôle |
|----------|-----------|------|
| `uploadToCloudinary` | `(fileBuffer: Buffer, preset?: string) => Promise<{url, publicId}>` | Upload un fichier en mémoire vers Cloudinary avec les transformations du preset |
| `deleteFromCloudinary` | `(publicId: string) => Promise<Result>` | Supprime UNE image |
| `deleteMultipleFromCloudinary` | `(images: {publicId: string}[]) => Promise<void>` | Supprime plusieurs images en parallèle (best-effort) |
| (export default) `cloudinary` | `Cloudinary` | Instance brute du SDK pour cas avancés |

## 5. Variables externes

| Variable | Type | Rôle |
|----------|------|------|
| `hasCloudinaryConfig` | `boolean` | Vrai si les 3 variables d'env (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) sont définies. Permet aux services de basculer sur des placeholders en dev quand Cloudinary n'est pas configuré. |

## 6. Notes d'implémentation

### Pourquoi transformer AVANT le stockage ?

Cloudinary facture le stockage ET les transformations. Si on stockait l'image originale (par exemple un JPEG 4000×4000 de 5 Mo) et qu'on demandait une transformation à chaque chargement (vers un WebP 800×800), on paierait :
- Le stockage de l'original
- Une transformation par requête

En appliquant la transformation **à l'upload** (paramètre `transformation` dans `upload_stream`), Cloudinary stocke directement la version finale. On économise sur les deux fronts.

### Upload via stream

```js
const stream = cloudinary.uploader.upload_stream({...}, callback);
stream.end(fileBuffer);
```

On utilise `upload_stream` parce que le fichier est en mémoire (`multer memoryStorage`). Si le fichier était sur disque, on pourrait utiliser `cloudinary.uploader.upload(filePath)` directement.

### `deleteMultipleFromCloudinary` — `Promise.allSettled`

```js
await Promise.allSettled(
  images.map((img) => cloudinary.uploader.destroy(img.publicId))
);
```

`allSettled` au lieu de `all` parce qu'on veut continuer même si certaines suppressions échouent (l'asset peut déjà avoir été supprimé manuellement, ou ne plus exister). C'est du nettoyage best-effort.

### Fallback en dev

Si `hasCloudinaryConfig` est `false`, les services utilisent des URLs placehold.co (voir `productService.createProduct`). Ça permet de développer sans avoir à configurer Cloudinary, mais les images ne persistent pas (placehold.co génère à la volée).

### Quotas Cloudinary

Le plan gratuit Cloudinary a des limites : ~25 GB de stockage, 25 GB de bande passante. Pour un projet étudiant c'est largement suffisant. En production réelle, surveiller ces métriques dans le dashboard Cloudinary.
