/**
 * @file Configuration Cloudinary + helpers d'upload/suppression d'images.
 *
 * Voir aussi : docs/modules/backend/config-cloudinary.md
 */

import { v2 as cloudinary } from "cloudinary";

/**
 * Vrai si les trois variables d'environnement Cloudinary sont définies.
 * Les services consomment ce booléen pour basculer sur des URLs placeholder en dev.
 *
 * @type {boolean}
 */
export const hasCloudinaryConfig = Boolean(
	process.env.CLOUDINARY_CLOUD_NAME &&
		process.env.CLOUDINARY_API_KEY &&
		process.env.CLOUDINARY_API_SECRET,
);

// ── Configure Cloudinary SDK ─────────────────────────────────────────────────
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Presets de transformation appliqués À L'UPLOAD (économise stockage + bande passante).
 *
 * @type {Record<"product"|"shopLogo"|"shopBanner"|"avatar", { folder: string, transformation: object[] }>}
 */
const UPLOAD_PRESETS = {
	product: {
		folder: "agora/products",
		transformation: [
			{ width: 1200, height: 1200, crop: "limit", quality: "auto:good", format: "webp" },
		],
	},
	shopLogo: {
		folder: "agora/shops/logos",
		transformation: [
			{ width: 400, height: 400, crop: "limit", quality: "auto:good", format: "webp" },
		],
	},
	shopBanner: {
		folder: "agora/shops/banners",
		transformation: [
			{ width: 1600, height: 500, crop: "limit", quality: "auto:good", format: "webp" },
		],
	},
	avatar: {
		folder: "agora/avatars",
		transformation: [
			{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto:good", format: "webp" },
		],
	},
};

/**
 * Envoie un buffer de fichier vers Cloudinary avec un preset de transformation.
 *
 * @param {Buffer} fileBuffer Données binaires du fichier (depuis `multer.memoryStorage`).
 * @param {"product"|"shopLogo"|"shopBanner"|"avatar"} [preset="product"] Preset à utiliser.
 * @returns {Promise<{ url: string, publicId: string }>} URL HTTPS publique + identifiant Cloudinary.
 */
export const uploadToCloudinary = (fileBuffer, preset = "product") => {
	const config = UPLOAD_PRESETS[preset] || UPLOAD_PRESETS.product;

	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: config.folder,
				resource_type: "image",
				transformation: config.transformation,
			},
			(error, result) => {
				if (error) return reject(error);
				resolve({
					url: result.secure_url,
					publicId: result.public_id,
				});
			},
		);

		stream.end(fileBuffer);
	});
};

/**
 * Supprime UNE image Cloudinary par son `publicId`.
 *
 * @param {string} publicId Identifiant Cloudinary de l'image (stocké en base à l'upload).
 * @returns {Promise<{ result: string }>} Résultat Cloudinary (`{ result: "ok" }` ou `{ result: "not found" }`).
 */
export const deleteFromCloudinary = (publicId) => {
	return cloudinary.uploader.destroy(publicId);
};

/**
 * Supprime plusieurs images Cloudinary en parallèle (best-effort).
 *
 * Utilise `Promise.allSettled` : une erreur sur une image n'interrompt pas les autres.
 *
 * @param {{ publicId: string }[]} [images=[]] Tableau d'objets contenant un `publicId`.
 * @returns {Promise<void>} Se résout quand toutes les suppressions ont été tentées.
 */
export const deleteMultipleFromCloudinary = async (images = []) => {
	await Promise.allSettled(
		images.map((img) => cloudinary.uploader.destroy(img.publicId)),
	);
};

export default cloudinary;
