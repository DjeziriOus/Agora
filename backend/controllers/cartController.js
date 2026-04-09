import cartService from "../services/cartService.js";

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return res.status(200).json(cart);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

// POST /api/cart/items
// Body: { productId, quantity? }
export const addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required." });
    }

    const cart = await cartService.addItem(req.user.id, productId, quantity);
    return res.status(200).json(cart);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

// PUT /api/cart/items/:productId
// Body: { quantity }
export const updateItem = async (req, res) => {
  try {
    if (req.body?.quantity === undefined) {
      return res.status(400).json({ message: "quantity is required." });
    }

    const cart = await cartService.updateItem(
      req.user.id,
      req.params.productId,
      req.body.quantity,
    );
    return res.status(200).json(cart);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

// DELETE /api/cart/items/:productId
export const removeItem = async (req, res) => {
  try {
    const cart = await cartService.removeItem(
      req.user.id,
      req.params.productId,
    );
    return res.status(200).json(cart);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    return res.status(200).json(cart);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error." });
  }
};
