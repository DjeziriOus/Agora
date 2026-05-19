/**
 * @file Handlers HTTP des routes `/api/cart/*`.
 *
 * Délègue la logique à {@link module:services/cartService}. Propage les
 * erreurs structurées (`code`, `maxAllowed`) au frontend pour qu'il ajuste
 * l'UI (sélecteurs de quantité, messages précis).
 *
 * Voir aussi : docs/modules/backend/controllers-cartController.md
 */

import {
  addItem,
  clearCart,
  getCart,
  getCheckoutSummary,
  removeItem,
  toggleSelected,
  updateQuantity,
} from "../services/cartService.js";

/**
 * Récupère le panier de l'utilisateur. Crée un panier vide à la volée s'il
 * n'existe pas encore.
 *
 * Route : `GET /api/cart`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getMyCart = async (req, res) => {
  try {
    const cart = await getCart(req.user.id);
    return res.status(200).json(cart);
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Ajoute un article au panier (ou incrémente sa quantité s'il y est déjà).
 *
 * Route : `POST /api/cart/add`
 * Body : `{ productId: string, quantity?: number, variantId?: string|null }`
 *
 * Erreurs possibles propagées avec champs supplémentaires :
 *   - `MAX_PER_ORDER` + `maxAllowed`
 *   - `INSUFFICIENT_STOCK` + `maxAllowed`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variantId = null } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }

    const cart = await addItem(req.user.id, productId, quantity, variantId);
    return res.status(200).json({
      message: "Item added to cart successfully.",
      cart,
    });
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Met à jour la quantité d'un article déjà dans le panier.
 *
 * Route : `PUT /api/cart/update-quantity`
 * Body : `{ productId: string, quantity: number, variantId?: string|null }`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity, variantId = null } = req.body;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "productId and quantity are required." });
    }

    const cart = await updateQuantity(
      req.user.id,
      productId,
      quantity,
      variantId,
    );
    return res.status(200).json({
      message: "Cart item quantity updated successfully.",
      cart,
    });
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Retire un article du panier.
 *
 * Route : `DELETE /api/cart/remove`
 * Body : `{ productId: string, variantId?: string|null }`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const removeFromCart = async (req, res) => {
  try {
    const { productId, variantId = null } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }

    const cart = await removeItem(req.user.id, productId, variantId);
    return res.status(200).json({
      message: "Item removed from cart successfully.",
      cart,
    });
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Bascule la case "selected" d'un article (coché = sera commandé au checkout).
 *
 * Route : `PATCH /api/cart/toggle-selected`
 * Body : `{ productId: string, variantId?: string|null }`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const toggleCartItemSelected = async (req, res) => {
  try {
    const { productId, variantId = null } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }

    const cart = await toggleSelected(req.user.id, productId, variantId);
    return res.status(200).json({
      message: "Cart item selection updated successfully.",
      cart,
    });
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Récupère le résumé checkout : seulement les items sélectionnés + sous-total + comptage.
 *
 * Route : `GET /api/cart/checkout-summary`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCartCheckoutSummary = async (req, res) => {
  try {
    const summary = await getCheckoutSummary(req.user.id);
    return res.status(200).json(summary);
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};

/**
 * Vide le panier (typiquement après une commande réussie).
 *
 * Route : `DELETE /api/cart/clear`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const clearMyCart = async (req, res) => {
  try {
    await clearCart(req.user.id);
    return res.status(200).json({ message: "Cart cleared successfully." });
  } catch (error) {
    const payload = { message: error.message || "Internal server error." };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    return res.status(error.statusCode || 500).json(payload);
  }
};
