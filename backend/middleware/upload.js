/**
 * @file Middlewares Multer pour la réception de fichiers uploadés.
 *
 * Tous les fichiers sont gardés EN MEMOIRE (Buffer), pas écrits sur disque.
 * Ils sont ensuite transmis directement à Cloudinary via `upload_stream`
 * (cf. {@link module:config/cloudinary}).
 *
 * Voir aussi : docs/modules/backend/middleware-upload.md
 */

import multer from "multer";

/**
 * Stockage Multer : tout en RAM. Pas de fichier temporaire sur disque.
 * Indispensable pour les hébergeurs serverless / read-only filesystem.
 */
const storage = multer.memoryStorage();

/**
 * Filtre les types MIME acceptés (JPEG, PNG, WebP uniquement).
 * Tout autre type est rejeté avec une erreur explicite en français.
 *
 * @param {import('express').Request} _req
 * @param {Express.Multer.File} file
 * @param {(err: Error|null, accept: boolean) => void} cb
 */
const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Type de fichier non supporté. Utilisez JPEG, PNG ou WebP."),
      false,
    );
  }
};

// ── Product images ───────────────────────────────────────────────────────────
// Jusqu'à 5 fichiers sur le champ "images", 5 Mo max chacun.
const productUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

/**
 * Middleware Express pour les uploads d'images produit.
 * Champ attendu : `images` (multiple, max 5).
 *
 * Après ce middleware, `req.files` est un tableau d'objets
 * `{ buffer, mimetype, originalname, size }`.
 *
 * @type {import('express').RequestHandler}
 */
export const uploadProductImages = productUpload.array("images", 5);

// ── Shop images (logo + banner) ──────────────────────────────────────────────
// Deux champs distincts : "logo" (1 fichier) et "banner" (1 fichier), 15 Mo max chacun.
const shopUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 2 },
});

/**
 * Middleware Express pour le logo et la bannière de boutique.
 * Champs attendus : `logo` (1 fichier max), `banner` (1 fichier max).
 *
 * Après ce middleware, `req.files` est un objet :
 *   `{ logo: [file], banner: [file] }` (selon ce qui a été envoyé).
 *
 * @type {import('express').RequestHandler}
 */
export const uploadShopImages = shopUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// ── Avatar (profile picture) ────────────────────────────────────────────────
// Un seul fichier sur le champ "avatar", 5 Mo max.
const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

/**
 * Middleware Express pour la photo de profil utilisateur.
 * Champ attendu : `avatar` (un seul fichier).
 *
 * Après ce middleware, `req.file` (au singulier) contient le fichier.
 *
 * @type {import('express').RequestHandler}
 */
export const uploadAvatar = avatarUpload.single("avatar");
