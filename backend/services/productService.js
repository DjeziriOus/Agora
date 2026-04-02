import mongoose from "mongoose";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

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

// Public products search/list endpoint used by catalogue pages.
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

// Return paginated products for the current seller inventory page.
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

// Update stock of one seller-owned product with ownership and input checks.
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

export default {
	getProducts,
	getMyProducts,
	updateProductStock,
};
