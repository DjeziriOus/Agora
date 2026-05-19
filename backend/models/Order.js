/**
 * @file Modèle Mongoose des commandes.
 *
 * Une commande contient N sous-commandes (une par boutique). Chaque sous-commande
 * a son propre statut et ses propres items. Le statut global de l'Order est
 * recalculé à partir des statuts des sous-commandes (cf. orderService.updateSubOrderStatus).
 *
 * Voir aussi : docs/modules/backend/models-Order.md
 *
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         userId: { type: string }
 *         status: { type: string, enum: [en_attente, en_preparation, en_livraison, livree, annulee] }
 *         totalPrice: { type: number }
 *         shippingAddress: { type: object }
 *         addressId: { type: string, description: "Référence optionnelle vers ClientAddress" }
 *         subOrders:
 *           type: array
 *           items: { $ref: '#/components/schemas/SubOrder' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     SubOrder:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         shopId: { type: string }
 *         shopName: { type: string }
 *         sellerId: { type: string }
 *         status: { type: string, enum: [en_attente, en_preparation, en_livraison, livree, annulee] }
 *         total: { type: number }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/SubOrderItem' }
 *         stockRestored: { type: boolean, description: "Flag idempotence pour la restoration de stock à l'annulation" }
 *     SubOrderItem:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         productId: { type: string }
 *         variantId: { type: string }
 *         productName: { type: string, description: "Snapshot au moment de la commande" }
 *         productImage: { type: string, description: "Snapshot URL" }
 *         quantity: { type: number }
 *         unitPrice: { type: number, description: "Snapshot prix au moment de la commande" }
 */

import mongoose from 'mongoose';

/**
 * Sous-schéma d'un item de sous-commande. Contient des SNAPSHOTS (productName,
 * productImage, unitPrice) figés au moment de la commande pour préserver
 * l'historique même si le produit change ou est supprimé.
 */
const subOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: true }
);

/**
 * Sous-schéma d'une sous-commande (une boutique = une sous-commande). Le `_id`
 * est utilisé comme identifiant de sous-commande dans les routes vendeur
 * (ex: PATCH /api/orders/:subOrderId/status).
 */
const subOrderSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopName: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'],
      default: 'en_attente',
    },
    total: { type: Number, required: true },
    items: [subOrderItemSchema],
    // Flag d'idempotence : empêche la double-restoration du stock si le vendeur
    // toggle plusieurs fois le statut "annulee".
    stockRestored: { type: Boolean, default: false },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'],
      default: 'en_attente',
    },
    totalPrice: { type: Number, required: true },
    // Snapshot de l'adresse au moment de la commande — figé même si
    // l'utilisateur supprime/modifie son carnet d'adresses.
    shippingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'France' },
      phone: String,
    },

    // Référence optionnelle vers l'adresse d'origine dans le carnet client.
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientAddress',
    },

    subOrders: [subOrderSchema],
  },
  { timestamps: true }
);

// Index pour l'historique acheteur trié par date décroissante.
orderSchema.index({ userId: 1, createdAt: -1 });

// Index pour la liste vendeur (cherche les commandes dont au moins une
// sous-commande a ce sellerId).
orderSchema.index({ 'subOrders.sellerId': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
