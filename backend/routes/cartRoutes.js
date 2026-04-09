import express from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from "../controllers/cartController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All cart routes require authentication.
router.use(verifyToken);

// GET  /api/cart              — get current user's cart
router.get("/", getCart);

// POST /api/cart/items        — add item { productId, quantity? }
router.post("/items", addItem);

// PUT  /api/cart/items/:productId — update item quantity { quantity }
router.put("/items/:productId", updateItem);

// DELETE /api/cart/items/:productId — remove one item
router.delete("/items/:productId", removeItem);

// DELETE /api/cart            — clear entire cart
router.delete("/", clearCart);

export default router;
