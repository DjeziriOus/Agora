import mongoose from "mongoose";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";
import Shop from "../models/Shop.js";
import {
	createVariantsForProduct,
	updateVariantsForProduct,
	getVariantsByProduct,
	computeAggregatesFromArray,
} from "./variantService.js";
import {
	uploadToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
	hasCloudinaryConfig,
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

// Parse variants from multipart/form-data body (stringified JSON) or plain object.
const parseVariantsInput = (rawVariants) => {
	if (rawVariants === undefined || rawVariants === null || rawVariants === "") {
		return [];
	}

	let parsed = rawVariants;
	if (typeof rawVariants === "string") {
		try {
			parsed = JSON.parse(rawVariants);
		} catch {
			const error = new Error("variants must be a valid JSON array.");
			error.statusCode = 400;
			throw error;
		}
	}

	if (!Array.isArray(parsed)) {
		const error = new Error("variants must be an array.");
		error.statusCode = 400;
		throw error;
	}

	return parsed;
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

/**
 * Enrich a product document with its variants and computed aggregates.
 * Returns a plain object ready for API response.
 */
const enrichProductWithVariants = async (product) => {
	const variants = await getVariantsByProduct(product._id);
	const aggregates = computeAggregatesFromArray(variants);

	const productObj = product.toJSON ? product.toJSON() : product;
	return {
		...productObj,
		variants,
		totalStock: aggregates.totalStock,
		displayPrice: aggregates.displayPrice,
		hasMultiplePrices: aggregates.hasMultiplePrices,
	};
};

/**
 * Enrich multiple products with their variants and computed aggregates.
 */
const enrichProductsWithVariants = async (products) => {
	if (products.length === 0) return [];

	const productIds = products.map((p) => p._id);
	const allVariants = await Variant.find({ product: { $in: productIds } }).sort({ createdAt: 1 });

	// Group variants by product ID
	const variantsByProduct = new Map();
	for (const v of allVariants) {
		const pid = v.product.toString();
		if (!variantsByProduct.has(pid)) {
			variantsByProduct.set(pid, []);
		}
		variantsByProduct.get(pid).push(v);
	}

	return products.map((product) => {
		const productObj = product.toJSON ? product.toJSON() : product;
		const variants = variantsByProduct.get(product._id.toString()) || [];
		const aggregates = computeAggregatesFromArray(variants);

		return {
			...productObj,
			variants,
			totalStock: aggregates.totalStock,
			displayPrice: aggregates.displayPrice,
			hasMultiplePrices: aggregates.hasMultiplePrices,
		};
	});
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

	return filters;
};

// ── Public catalogue listing ─────────────────────────────────────────────────
const getProducts = async (query = {}) => {
	const page = toSafeInt(query.page, DEFAULT_PAGE);
	const limit = Math.min(toSafeInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
	const skip = (page - 1) * limit;

	const filters = buildPublicFilters(query);

	// If price filtering is requested, find product IDs with matching variant prices first
	const minPrice = Number(query.minPrice);
	const maxPrice = Number(query.maxPrice);
	if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
		const priceFilter = {};
		if (Number.isFinite(minPrice)) priceFilter.$gte = minPrice;
		if (Number.isFinite(maxPrice)) priceFilter.$lte = maxPrice;

		const matchingProductIds = await Variant.distinct("product", {
			price: priceFilter,
			isActive: true,
		});
		filters._id = { $in: matchingProductIds };
	}

	const [products, total] = await Promise.all([
		Product.find(filters).populate("shop", "name").sort({ createdAt: -1 }).skip(skip).limit(limit),
		Product.countDocuments(filters),
	]);

	const enriched = await enrichProductsWithVariants(products);

	return {
		products: enriched,
		total,
		page,
		limit,
	};
};

// ── Public product detail ───────────────────────────────────────────────────
const getProductById = async (productId) => {
	assertObjectId(productId, "product id");

	const product = await Product.findOne({
		_id: productId,
		isDeleted: false,
		isActive: true,
	}).populate("shop", "name");

	if (!product) {
		const error = new Error("Product not found.");
		error.statusCode = 404;
		throw error;
	}

	return enrichProductWithVariants(product);
};

// ── Seller product detail ───────────────────────────────────────────────────
const getMyProductById = async ({ ownerId, productId }) => {
	assertObjectId(productId, "product id");

	const shop = await getSellerShopOrThrow(ownerId);

	const product = await Product.findOne({
		_id: productId,
		shop: shop._id,
		isDeleted: false,
	}).populate("shop", "name");

	if (!product) {
		const error = new Error("Product not found.");
		error.statusCode = 404;
		throw error;
	}

	return enrichProductWithVariants(product);
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

	let enriched = await enrichProductsWithVariants(products);

	// Filter low stock after enrichment (since stock is now on variants)
	if (query.lowStock === "true") {
		enriched = enriched.filter((p) => p.totalStock <= (p.stockThreshold ?? 5));
	}

	return {
		products: enriched,
		total: query.lowStock === "true" ? enriched.length : total,
		page,
		limit,
	};
};

// ── Create product (at least 1 image required) ──────────────────────────────
const createProduct = async ({ ownerId, body, files = [] }) => {
	if (!files.length) {
		const error = new Error("Au moins une image est requise.");
		error.statusCode = 400;
		throw error;
	}

	if (!String(body.category || "").trim()) {
		const error = new Error("La categorie du produit est requise.");
		error.statusCode = 400;
		throw error;
	}

	const shop = await getSellerShopOrThrow(ownerId);
	let variants = parseVariantsInput(body.variants);

	// Auto-create a default variant for "simple" products
	if (variants.length === 0) {
		const price = Number(body.price);
		const stock = Number(body.stock ?? 0);

		if (!Number.isFinite(price) || price < 0) {
			const error = new Error("Le prix est requis pour un produit simple.");
			error.statusCode = 400;
			throw error;
		}

		variants = [
			{
				code: "default",
				name: "Standard",
				sku: "",
				price,
				stock: Number.isInteger(stock) ? stock : 0,
				isActive: true,
			},
		];
	}

	// Validate all variants have required fields
	for (const v of variants) {
		if (!v.code || !v.name) {
			const error = new Error("Chaque variant doit avoir un code et un nom.");
			error.statusCode = 400;
			throw error;
		}
		if (!Number.isFinite(Number(v.price)) || Number(v.price) < 0) {
			const error = new Error("Chaque variant doit avoir un prix valide.");
			error.statusCode = 400;
			throw error;
		}
	}

	// Upload each file to Cloudinary when configured; otherwise use dev placeholders.
	const images = hasCloudinaryConfig
		? await Promise.all(files.map((file) => uploadToCloudinary(file.buffer, "product")))
		: files.map((_file, index) => ({
				url: "https://placehold.co/1200x1200?text=Product+Image",
				publicId: `dev-placeholder-${Date.now()}-${index}`,
		  }));

	const product = new Product({
		name: body.name,
		description: body.description || "",
		category: body.category,
		stockThreshold: body.stockThreshold ?? 5,
		images,
		isActive: body.isActive === "true" || body.isActive === true,
		shop: shop._id,
	});

	await product.save();

	// Create variants in the separate collection
	await createVariantsForProduct(product._id, variants);

	return enrichProductWithVariants(product);
};

// ── Update product (text fields + image add/remove) ──────────────────────────
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
	if (body.category !== undefined) product.category = body.category;
	if (body.stockThreshold !== undefined) product.stockThreshold = body.stockThreshold;
	if (body.isActive !== undefined) product.isActive = body.isActive === "true" || body.isActive === true;

	// ── Update variants if provided ──────────────────────────────────────────
	if (body.variants !== undefined) {
		let variants = parseVariantsInput(body.variants);

		// Auto-create a default variant for "simple" products
		if (variants.length === 0) {
			const price = Number(body.price);
			const stock = Number(body.stock ?? 0);

			if (!Number.isFinite(price) || price < 0) {
				const error = new Error("Le prix est requis pour un produit simple.");
				error.statusCode = 400;
				throw error;
			}

			variants = [
				{
					code: "default",
					name: "Standard",
					sku: "",
					price,
					stock: Number.isInteger(stock) ? stock : 0,
					isActive: true,
				},
			];
		}

		// Validate all variants
		for (const v of variants) {
			if (!v.code || !v.name) {
				const error = new Error("Chaque variant doit avoir un code et un nom.");
				error.statusCode = 400;
				throw error;
			}
			if (!Number.isFinite(Number(v.price)) || Number(v.price) < 0) {
				const error = new Error("Chaque variant doit avoir un prix valide.");
				error.statusCode = 400;
				throw error;
			}
		}

		await updateVariantsForProduct(product._id, variants);
	}

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

	// Upload new images when Cloudinary is configured; otherwise use dev placeholders.
	const newImages = hasCloudinaryConfig
		? await Promise.all(files.map((file) => uploadToCloudinary(file.buffer, "product")))
		: files.map((_file, index) => ({
				url: "https://placehold.co/1200x1200?text=Product+Image",
				publicId: `dev-placeholder-update-${Date.now()}-${index}`,
		  }));

	const finalImages = [...imagesToKeep, ...newImages];

	// Must still have at least 1 image after the edit.
	if (finalImages.length === 0) {
		const error = new Error("Le produit doit avoir au moins une image.");
		error.statusCode = 400;
		throw error;
	}

	product.images = finalImages;
	await product.save();

	// Clean up deleted Cloudinary images (skip for dev placeholders).
	if (hasCloudinaryConfig) {
		deleteMultipleFromCloudinary(imagesToDelete);
	}

	return enrichProductWithVariants(product);
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

	// Soft-delete associated variants (mark inactive)
	await Variant.updateMany({ product: product._id }, { isActive: false });

	// Delete all Cloudinary images when configured.
	if (hasCloudinaryConfig) {
		deleteMultipleFromCloudinary(product.images);
	}

	return product;
};

export default {
	createProduct,
	updateProduct,
	deleteProduct,
	getProducts,
	getProductById,
	getMyProductById,
	getMyProducts,
};
