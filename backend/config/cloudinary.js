import { v2 as cloudinary } from "cloudinary";

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

// ── Credit-Saving Defaults ───────────────────────────────────────────────────
// Incoming transformation: downscale oversized uploads BEFORE they are stored,
// so the "original" asset is already reasonable. This saves storage and avoids
// paying for on-the-fly transforms later.
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
};

/**
 * Upload a file buffer to Cloudinary with a preset (product | shopLogo | shopBanner).
 * Incoming transformation limits dimensions and converts to webp before storage.
 * @param {Buffer} fileBuffer — raw file bytes (from multer memoryStorage)
 * @param {"product"|"shopLogo"|"shopBanner"} preset — which upload preset to use
 * @returns {Promise<{ url: string, publicId: string }>}
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
 * Delete a single image from Cloudinary by its public ID.
 * @param {string} publicId
 */
export const deleteFromCloudinary = (publicId) => {
	return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple images from Cloudinary in parallel.
 * Silently ignores individual failures (asset may already be gone).
 * @param {{ publicId: string }[]} images — array of image objects with publicId
 */
export const deleteMultipleFromCloudinary = async (images = []) => {
	await Promise.allSettled(
		images.map((img) => cloudinary.uploader.destroy(img.publicId)),
	);
};

export default cloudinary;
