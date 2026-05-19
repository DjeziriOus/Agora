/**
 * @file Service utilitaire pour la collection `variants`.
 *
 * Voir aussi : docs/modules/backend/services-variantService.md
 */

import Variant from "../models/Variant.js";

/**
 * Normalise `maxPerOrder` à un entier ≥ 1. Sinon défaut 10.
 * @param {*} value
 * @returns {number}
 */
const sanitizeMaxPerOrder = (value) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
		return 10;
	}
	return parsed;
};

/**
 * Crée plusieurs variantes pour un produit en une seule opération `insertMany`.
 *
 * @param {import('mongoose').Types.ObjectId|string} productId
 * @param {Array<Object>} variantsArray - Tableau de variantes à créer.
 * @returns {Promise<import('mongoose').Document[]>}
 */
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
 * Synchronise les variantes d'un produit avec le tableau fourni
 * (pattern « upsert + delete-by-diff »).
 *
 * Les variantes ayant un `id` existant sont mises à jour, les nouvelles
 * créées, et toute variante existante absente du tableau est SUPPRIMÉE.
 *
 * @param {import('mongoose').Types.ObjectId|string} productId
 * @param {Array<Object>} variantsArray - État souhaité après l'opération.
 * @returns {Promise<Array>}
 * @throws {Error} 400 si le tableau est vide.
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
 * Liste toutes les variantes d'un produit, triées par date de création.
 * @param {import('mongoose').Types.ObjectId|string} productId
 * @returns {Promise<import('mongoose').Document[]>}
 */
export const getVariantsByProduct = async (productId) => {
	return Variant.find({ product: productId }).sort({ createdAt: 1 });
};

/**
 * Trouve une variante par son code (unique au sein d'un produit).
 * @param {import('mongoose').Types.ObjectId|string} productId
 * @param {string} code
 * @returns {Promise<import('mongoose').Document|null>}
 */
export const getVariantByCode = async (productId, code) => {
	return Variant.findOne({ product: productId, code });
};

/**
 * Charge les variantes d'un produit et calcule les agrégats.
 * @param {import('mongoose').Types.ObjectId|string} productId
 * @returns {Promise<{ totalStock: number, displayPrice: number, hasMultiplePrices: boolean }>}
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
 * Calcule les agrégats à partir d'un tableau de variantes déjà chargé (synchrone, pas de DB).
 *
 * - `totalStock` : somme des stocks des variantes actives.
 * - `displayPrice` : prix le plus bas (0 si aucune variante active).
 * - `hasMultiplePrices` : true s'il existe ≥ 2 prix distincts.
 *
 * @param {Array<{stock: number, price: number, isActive?: boolean}>} variants
 * @returns {{ totalStock: number, displayPrice: number, hasMultiplePrices: boolean }}
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
