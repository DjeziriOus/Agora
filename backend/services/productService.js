import mongoose from "mongoose";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import {
	uploadToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
} from "../config/cloudinary.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

// Parse a positive integer query param, otherwise use fallback.
const toSafeInt = (value, fallback) => {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Escape regex metacharacters so user input is treated as plain text.
const escapeRegExp = (value = "") =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Fail fast when an id is not a valid Mongo ObjectId.
const assertObjectId = (value, label) => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		const error = new Error(`Invalid ${label}.`);
		error.statusCode = 400;
		throw error;
	}
};

// Resolve seller shop once; all seller product operations are scoped to it.
const getSellerShopOrThrow = async (ownerId) => {
	const shop = await Shop.findOne({ owner: ownerId, isDeleted: false });
	if (!shop) {
		const error = new Error("No shop found for this seller.");
		error.statusCode = 404;
		throw error;
	}
	return shop;
};

// Build Mongo filters for seller inventory listing (search, stock, status).
const buildMineFilters = (shopId, query = {}) => {
	const filters = {
		shop: shopId,
		isDeleted: false,
	};

	const q = (query.q || query.search || "").trim();
	if (q) {
		const safeQ = escapeRegExp(q);
		filters.$or = [
			{ name: { $regex: safeQ, $options: "i" } },
			{ description: { $regex: safeQ, $options: "i" } },
		];
	}

	if (query.lowStock === "true") {
		filters.$expr = { $lte: ["$stock", "$stockThreshold"] };
	}

	if (query.isActive === "true") filters.isActive = true;
	if (query.isActive === "false") filters.isActive = false;

	return filters;
};

// Build filters for public catalogue listing.
const buildPublicFilters = (query = {}) => {
	const filters = {
		isDeleted: false,
		isActive: true,
	};

	const q = (query.q || query.search || "").trim();
	if (q) {
		const safeQ = escapeRegExp(q);
		filters.$or = [
			{ name: { $regex: safeQ, $options: "i" } },
			{ description: { $regex: safeQ, $options: "i" } },
		];
	}

	const minPrice = Number(query.minPrice);
	const maxPrice = Number(query.maxPrice);
	if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
		filters.price = {};
		if (Number.isFinite(minPrice)) filters.price.$gte = minPrice;
		if (Number.isFinite(maxPrice)) filters.price.$lte = maxPrice;
	}

	return filters;
};

// ── Public catalogue listing ─────────────────────────────────────────────────
const getProducts = async (query = {}) => {
	const page = toSafeInt(query.page, DEFAULT_PAGE);
	const limit = Math.min(toSafeInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
	const skip = (page - 1) * limit;

	const filters = buildPublicFilters(query);

	const [products, total] = await Promise.all([
		Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
		Product.countDocuments(filters),
	]);

	return {
		products,
		total,
		page,
		limit,
	};
};

// ── Seller inventory listing ─────────────────────────────────────────────────
const getMyProducts = async ({ ownerId, query = {} }) => {
	const shop = await getSellerShopOrThrow(ownerId);

	const page = toSafeInt(query.page, DEFAULT_PAGE);
	const limit = Math.min(toSafeInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
	const skip = (page - 1) * limit;

	const filters = buildMineFilters(shop._id, query);

	const [products, total] = await Promise.all([
		Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
		Product.countDocuments(filters),
	]);

	return {
		products,
		total,
		page,
		limit,
	};
};

// ── Update product stock ─────────────────────────────────────────────────────
const updateProductStock = async ({ ownerId, productId, stock }) => {
	assertObjectId(productId, "product id");

	const parsedStock = Number(stock);
	if (!Number.isInteger(parsedStock) || parsedStock < 0) {
		const error = new Error("Invalid stock. Stock must be a non-negative integer.");
		error.statusCode = 400;
		throw error;
	}

	const shop = await getSellerShopOrThrow(ownerId);

	const product = await Product.findOne({
		_id: productId,
		shop: shop._id,
		isDeleted: false,
	});

	if (!product) {
		const error = new Error("Product not found.");
		error.statusCode = 404;
		throw error;
	}

	product.stock = parsedStock;
	await product.save();

	return product;
};

// ── Create product (at least 1 image required) ──────────────────────────────
const createProduct = async ({ ownerId, body, files = [] }) => {
	if (!files.length) {
		const error = new Error("Au moins une image est requise.");
		error.statusCode = 400;
		throw error;
	}

	const shop = await getSellerShopOrThrow(ownerId);

	// Upload each file buffer to Cloudinary in parallel.
	const images = await Promise.all(
		files.map((file) => uploadToCloudinary(file.buffer, "product")),
	);

	const product = new Product({
		name: body.name,
		description: body.description || "",
		price: body.price,
		stock: body.stock ?? 0,
		stockThreshold: body.stockThreshold ?? 5,
		images,
		shop: shop._id,
	});

	await product.save();
	return product;
};

// ── Update product (text fields + image add/remove) ──────────────────────────
// keepImages: JSON array of publicIds to retain (e.g. '["agora/products/abc"]')
// new files in req.files are uploaded and appended.
// Any existing image NOT in keepImages is deleted from Cloudinary.
const updateProduct = async ({ ownerId, productId, body, files = [] }) => {
	assertObjectId(productId, "product id");

	const shop = await getSellerShopOrThrow(ownerId);

	const product = await Product.findOne({
		_id: productId,
		shop: shop._id,
		isDeleted: false,
	});

	if (!product) {
		const error = new Error("Product not found.");
		error.statusCode = 404;
		throw error;
	}

	// ── Update text fields if provided ───────────────────────────────────────
	if (body.name !== undefined) product.name = body.name;
	if (body.description !== undefined) product.description = body.description;
	if (body.price !== undefined) product.price = body.price;
	if (body.stock !== undefined) product.stock = body.stock;
	if (body.stockThreshold !== undefined) product.stockThreshold = body.stockThreshold;
	if (body.isActive !== undefined) product.isActive = body.isActive === "true" || body.isActive === true;

	// ── Handle image changes ─────────────────────────────────────────────────
	// Parse keepImages — publicIds the seller wants to retain.
	let keepSet = new Set();
	if (body.keepImages) {
		try {
			const parsed = JSON.parse(body.keepImages);
			if (Array.isArray(parsed)) keepSet = new Set(parsed);
		} catch {
			const error = new Error("keepImages must be a valid JSON array of publicIds.");
			error.statusCode = 400;
			throw error;
		}
	}

	// Determine which existing images to keep vs delete.
	const imagesToKeep = [];
	const imagesToDelete = [];

	for (const img of product.images) {
		if (keepSet.size === 0 && files.length === 0) {
			// No image changes requested — keep everything.
			imagesToKeep.push(img);
		} else if (keepSet.has(img.publicId)) {
			imagesToKeep.push(img);
		} else if (keepSet.size > 0 || files.length > 0) {
			// keepImages was provided or new files sent — drop images not in keepSet.
			imagesToDelete.push(img);
		} else {
			imagesToKeep.push(img);
		}
	}

	// Upload new images.
	const newImages = await Promise.all(
		files.map((file) => uploadToCloudinary(file.buffer, "product")),
	);

	const finalImages = [...imagesToKeep, ...newImages];

	// Must still have at least 1 image after the edit.
	if (finalImages.length === 0) {
		const error = new Error("Le produit doit avoir au moins une image.");
		error.statusCode = 400;
		throw error;
	}

	product.images = finalImages;
	await product.save();

	// Clean up deleted images from Cloudinary (fire-and-forget, don't block response).
	deleteMultipleFromCloudinary(imagesToDelete);

	return product;
};

// ── Delete product (soft delete + Cloudinary cleanup) ────────────────────────
const deleteProduct = async ({ ownerId, productId }) => {
	assertObjectId(productId, "product id");

	const shop = await getSellerShopOrThrow(ownerId);

	const product = await Product.findOne({
		_id: productId,
		shop: shop._id,
		isDeleted: false,
	});

	if (!product) {
		const error = new Error("Product not found.");
		error.statusCode = 404;
		throw error;
	}

	product.isDeleted = true;
	await product.save();

	// Delete all product images from Cloudinary to free storage.
	deleteMultipleFromCloudinary(product.images);

	return product;
};

export default {
	createProduct,
	updateProduct,
	deleteProduct,
	getProducts,
	getMyProducts,
	updateProductStock,
};
