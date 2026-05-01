import Variant from "../models/Variant.js";

/**
 * Create multiple variants for a product in bulk.
 */
const sanitizeMaxPerOrder = (value) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
		return 10;
	}
	return parsed;
};

export const createVariantsForProduct = async (productId, variantsArray) => {
	const docs = variantsArray.map((v) => ({
		product: productId,
		code: v.code,
		name: v.name,
		sku: v.sku || "",
		price: Number(v.price),
		stock: Number.isInteger(Number(v.stock)) ? Number(v.stock) : 0,
		maxPerOrder: sanitizeMaxPerOrder(v.maxPerOrder),
		attributes: v.attributes || {},
		isActive: v.isActive !== false,
	}));

	return Variant.insertMany(docs);
};

/**
 * Upsert variants for a product.
 * - Variants with an existing `id` are updated.
 * - Variants without an `id` are created.
 * - Any existing variants NOT in the input array are deleted.
 */
export const updateVariantsForProduct = async (productId, variantsArray) => {
	if (!variantsArray || variantsArray.length === 0) {
		const error = new Error("A product must have at least one variant.");
		error.statusCode = 400;
		throw error;
	}

	const existingVariants = await Variant.find({ product: productId });
	const existingById = new Map(existingVariants.map((v) => [v._id.toString(), v]));

	const incomingIds = new Set();
	const operations = [];

	for (const v of variantsArray) {
		const variantId = v.id || v._id;

		if (variantId && existingById.has(String(variantId))) {
			// Update existing variant
			incomingIds.add(String(variantId));
			operations.push(
				Variant.findByIdAndUpdate(
					variantId,
					{
						code: v.code,
						name: v.name,
						sku: v.sku || "",
						price: Number(v.price),
						stock: Number.isInteger(Number(v.stock)) ? Number(v.stock) : 0,
						maxPerOrder: sanitizeMaxPerOrder(v.maxPerOrder),
						attributes: v.attributes || {},
						isActive: v.isActive !== false,
					},
					{ new: true },
				),
			);
		} else {
			// Create new variant
			operations.push(
				Variant.create({
					product: productId,
					code: v.code,
					name: v.name,
					sku: v.sku || "",
					price: Number(v.price),
					stock: Number.isInteger(Number(v.stock)) ? Number(v.stock) : 0,
					maxPerOrder: sanitizeMaxPerOrder(v.maxPerOrder),
					attributes: v.attributes || {},
					isActive: v.isActive !== false,
				}),
			);
		}
	}

	// Delete variants that are no longer in the incoming array
	const toDelete = existingVariants
		.filter((v) => !incomingIds.has(v._id.toString()))
		.map((v) => v._id);

	if (toDelete.length > 0) {
		await Variant.deleteMany({ _id: { $in: toDelete } });
	}

	const results = await Promise.all(operations);
	return results;
};

/**
 * Get all variants for a product.
 */
export const getVariantsByProduct = async (productId) => {
	return Variant.find({ product: productId }).sort({ createdAt: 1 });
};

/**
 * Get a single variant by its code within a product.
 */
export const getVariantByCode = async (productId, code) => {
	return Variant.findOne({ product: productId, code });
};

/**
 * Compute aggregate values for a product from its variants.
 * Returns { totalStock, displayPrice, hasMultiplePrices }.
 */
export const computeProductAggregates = async (productId) => {
	const variants = await Variant.find({ product: productId, isActive: true });

	if (variants.length === 0) {
		return { totalStock: 0, displayPrice: 0, hasMultiplePrices: false };
	}

	const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
	const prices = variants.map((v) => v.price);
	const displayPrice = Math.min(...prices);
	const hasMultiplePrices = new Set(prices).size > 1;

	return { totalStock, displayPrice, hasMultiplePrices };
};

/**
 * Compute aggregates from an already-loaded variants array (no DB query).
 */
export const computeAggregatesFromArray = (variants) => {
	const active = variants.filter((v) => v.isActive !== false);
	if (active.length === 0) {
		return { totalStock: 0, displayPrice: 0, hasMultiplePrices: false };
	}

	const totalStock = active.reduce((sum, v) => sum + v.stock, 0);
	const prices = active.map((v) => v.price);
	const displayPrice = Math.min(...prices);
	const hasMultiplePrices = new Set(prices).size > 1;

	return { totalStock, displayPrice, hasMultiplePrices };
};

export default {
	createVariantsForProduct,
	updateVariantsForProduct,
	getVariantsByProduct,
	getVariantByCode,
	computeProductAggregates,
	computeAggregatesFromArray,
};
