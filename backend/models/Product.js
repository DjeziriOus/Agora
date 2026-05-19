/**
 * @file Modèle Mongoose des produits.
 *
 * IMPORTANT : un produit ne contient PAS de `price` ni de `stock` à plat.
 * Ces valeurs sont stockées sur les variantes (cf. {@link module:models/Variant}).
 * Un produit a toujours au moins une variante (même pour les produits simples,
 * une variante par défaut nommée "Standard" est créée automatiquement).
 *
 * Voir aussi : docs/modules/backend/models-Product.md
 *
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string, minLength: 3, maxLength: 100 }
 *         description: { type: string, maxLength: 1000 }
 *         category: { type: string, maxLength: 100 }
 *         stockThreshold: { type: number, description: "Seuil de stock bas" }
 *         images:
 *           type: array
 *           items: { $ref: '#/components/schemas/CloudinaryImage' }
 *         isActive: { type: boolean }
 *         isDeleted: { type: boolean }
 *         shop: { type: string, description: "ObjectId Shop" }
 *         variants:
 *           type: array
 *           items: { $ref: '#/components/schemas/Variant' }
 *         displayPrice: { type: number, description: "Prix min des variantes actives (calculé)" }
 *         hasMultiplePrices: { type: boolean, description: "Calculé" }
 *         totalStock: { type: number, description: "Calculé (mode seller)" }
 *         inStock: { type: boolean, description: "Calculé (mode public)" }
 *         lowStock: { type: boolean, description: "Calculé (mode public)" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

import mongoose from "mongoose";
import "../models/Shop.js";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [3, "Product name must be at least 3 characters long"],
            maxlength: [100, "Product name must be at most 100 characters long"],
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: [1000, "Product description must be at most 1000 characters long"],
        },
        category: {
            type: String,
            required: [true, "Product category is required"],
            trim: true,
            maxlength: [100, "Product category must be at most 100 characters long"],
        },
        stockThreshold: {
            type: Number,
            default: 5,
            min: [0, "Stock threshold cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Stock threshold must be an integer",
            },
        },
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: [true, "Shop is required"],
        },
    },
    {
        timestamps: true,
        collection: "products",
    },
);

// Index pour les listings vendeur fréquents : "tous les produits non-supprimés
// de cette boutique".
productSchema.index({ shop: 1, isDeleted: 1 });

// Transformation à la sérialisation JSON : ajoute un champ `id` (string) en
// plus de `_id` (ObjectId). Le frontend lit `product.id` partout.
productSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    return ret;
  },
});


export default mongoose.model("Product", productSchema);
