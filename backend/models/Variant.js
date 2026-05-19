/**
 * @file Modèle Mongoose des variantes de produit.
 *
 * Une variante représente une déclinaison (taille, couleur, etc.) d'un produit.
 * C'est ici que sont stockés le PRIX et le STOCK — pas sur le produit parent.
 *
 * Voir aussi : docs/modules/backend/models-Variant.md
 *
 * @swagger
 * components:
 *   schemas:
 *     Variant:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         product: { type: string, description: "ObjectId du produit parent" }
 *         code: { type: string, description: "Identifiant interne unique par produit" }
 *         name: { type: string, description: "Affiché à l'acheteur (ex: 'Taille M')" }
 *         sku: { type: string }
 *         price: { type: number, minimum: 0 }
 *         stock: { type: number, minimum: 0, description: "Masqué dans les réponses publiques" }
 *         maxPerOrder: { type: number, minimum: 1, default: 10 }
 *         attributes:
 *           type: object
 *           additionalProperties: { type: string }
 *           example: { taille: "M", couleur: "rouge" }
 *         isActive: { type: boolean }
 *         maxPurchasable: { type: number, description: "min(stock, maxPerOrder) — exposé en public" }
 *         inStock: { type: boolean, description: "Calculé pour public" }
 *         lowStock: { type: boolean, description: "Calculé pour public" }
 */

import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: [true, "Product reference is required"],
			index: true,
		},
		code: {
			type: String,
			required: [true, "Variant code is required"],
			trim: true,
		},
		name: {
			type: String,
			required: [true, "Variant name is required"],
			trim: true,
		},
		sku: {
			type: String,
			default: "",
			trim: true,
		},
		price: {
			type: Number,
			required: [true, "Variant price is required"],
			min: [0, "Variant price must be a positive number"],
		},
		stock: {
			type: Number,
			required: true,
			default: 0,
			min: [0, "Variant stock cannot be negative"],
			validate: {
				validator: Number.isInteger,
				message: "Variant stock must be an integer",
			},
		},
		maxPerOrder: {
			type: Number,
			default: 10,
			min: [1, "maxPerOrder must be at least 1"],
			validate: {
				validator: Number.isInteger,
				message: "maxPerOrder must be an integer",
			},
		},
		attributes: {
			type: Map,
			of: String,
			default: {},
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		collection: "variants",
	},
);

// Index composite unique : deux variantes du même produit ne peuvent pas
// avoir le même code (mais deux produits différents peuvent avoir des
// variantes avec le même code, ex. "default").
variantSchema.index({ product: 1, code: 1 }, { unique: true });

// Sérialisation JSON : ajoute `id` (string) en plus de `_id`.
variantSchema.set("toJSON", {
	virtuals: true,
	transform: (_, ret) => {
		ret.id = ret._id.toString();
		return ret;
	},
});

export default mongoose.model("Variant", variantSchema);
