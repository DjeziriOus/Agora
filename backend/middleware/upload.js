import multer from "multer";

// Keep files in memory as buffers — no temp files on disk.
const storage = multer.memoryStorage();

// Only accept common image MIME types.
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
// Up to 5 files on the "images" field, max 5 MB each.
const productUpload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

export const uploadProductImages = productUpload.array("images", 5);

// ── Shop images (logo + banner) ──────────────────────────────────────────────
// Two single-file fields: "logo" and "banner", max 5 MB each.
const shopUpload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024, files: 2 },
});

export const uploadShopImages = shopUpload.fields([
	{ name: "logo", maxCount: 1 },
	{ name: "banner", maxCount: 1 },
]);
