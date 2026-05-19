/**
 * @file Modèle Mongoose des paniers acheteur.
 *
 * Un user (acheteur) a un seul panier (contrainte unique sur `userId`). Le
 * panier contient une liste d'items (productId + variantId + quantité).
 *
 * Voir aussi : docs/modules/backend/models-Cart.md
 *
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         userId: { type: string, description: "ID Better Auth de l'acheteur" }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/CartItem' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CartItem:
 *       type: object
 *       properties:
 *         productId: { type: string, description: "ObjectId Product (populé en lecture)" }
 *         variantId: { type: string, description: "ObjectId Variant (populé en lecture)" }
 *         quantity: { type: number, minimum: 1 }
 *         selected: { type: boolean, default: true }
 *         addedAt: { type: string, format: date-time }
 */

import mongoose from "mongoose";

/**
 * Sous-schéma d'un item de panier. Pas de `_id` propre (identifié par
 * la combinaison productId + variantId).
 */
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Référence vers le document Variant — toujours requis (même les produits
    // simples ont une variante par défaut).
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    // Vrai si l'item doit être inclus au checkout. Permet de décocher
    // certains items sans les retirer du panier.
    selected: {
      type: Boolean,
      default: true,
    },
    // Horodatage utile pour trier le panier par date d'ajout.
    addedAt: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      // Les IDs Better Auth sont des strings (UUIDs), pas des ObjectIds.
      type: String,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Cart", cartSchema);
