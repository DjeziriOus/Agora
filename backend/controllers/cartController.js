import {
  addItem,
  clearCart,
  getCart,
  getCheckoutSummary,
  removeItem,
  toggleSelected,
  updateQuantity,
} from "../services/cartService.js";

// GET /api/cart
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

// POST /api/cart/add
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

// PUT /api/cart/update-quantity
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

// DELETE /api/cart/remove
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

// PATCH /api/cart/toggle-selected
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

// GET /api/cart/checkout-summary
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

// DELETE /api/cart/clear
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
