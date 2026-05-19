/**
 * @file Routes panier acheteur. Toutes les routes exigent un acheteur connecté.
 * Voir aussi : docs/modules/backend/routes-cartRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Panier de l'acheteur (1 panier par utilisateur)
 */

import express from "express";
import {
  addToCart,
  clearMyCart,
  getCartCheckoutSummary,
  getMyCart,
  removeFromCart,
  toggleCartItemSelected,
  updateCartItemQuantity,
} from "../controllers/cartController.js";
import { isBuyer, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All cart endpoints require an authenticated buyer.
router.use(verifyToken, isBuyer);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Récupère le panier de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Panier sanitizé (stock réel masqué)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 */
router.get("/", getMyCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Ajoute un produit au panier (ou incrémente sa quantité)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string, nullable: true }
 *               quantity:  { type: integer, default: 1 }
 *     responses:
 *       200: { description: Panier mis à jour }
 *       400: { description: "MAX_PER_ORDER ou INSUFFICIENT_STOCK" }
 *       404: { description: Produit ou variante introuvable }
 */
router.post("/add", addToCart);

/**
 * @swagger
 * /api/cart/update-quantity:
 *   put:
 *     tags: [Cart]
 *     summary: Modifie la quantité d'un item du panier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, variantId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               quantity:  { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Panier mis à jour }
 *       400: { description: "MAX_PER_ORDER ou INSUFFICIENT_STOCK" }
 */
router.put("/update-quantity", updateCartItemQuantity);

/**
 * @swagger
 * /api/cart/remove:
 *   delete:
 *     tags: [Cart]
 *     summary: Retire un item du panier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, variantId]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *     responses:
 *       200: { description: Panier mis à jour }
 *       404: { description: Item introuvable }
 */
router.delete("/remove", removeFromCart);

/**
 * @swagger
 * /api/cart/toggle-selected:
 *   patch:
 *     tags: [Cart]
 *     summary: Bascule le flag selected d'un item (sera commandé au checkout)
 *     responses:
 *       200: { description: Panier mis à jour }
 */
router.patch("/toggle-selected", toggleCartItemSelected);

/**
 * @swagger
 * /api/cart/checkout-summary:
 *   get:
 *     tags: [Cart]
 *     summary: Résumé des items sélectionnés pour le checkout
 *     responses:
 *       200:
 *         description: Total et sous-total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subtotal:  { type: number }
 *                 itemCount: { type: integer }
 *                 selectedItems: { type: array, items: { type: object } }
 */
router.get("/checkout-summary", getCartCheckoutSummary);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Vide complètement le panier
 *     responses:
 *       200: { description: Panier vidé }
 */
router.delete("/clear", clearMyCart);

export default router;
