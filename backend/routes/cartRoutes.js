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
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// All cart endpoints require an authenticated user.
router.use(verifyToken);

// GET /api/cart
router.get("/", getMyCart);

// POST /api/cart/add
router.post("/add", addToCart);

// PUT /api/cart/update-quantity
router.put("/update-quantity", updateCartItemQuantity);

// DELETE /api/cart/remove
router.delete("/remove", removeFromCart);

// PATCH /api/cart/toggle-selected
router.patch("/toggle-selected", toggleCartItemSelected);

// GET /api/cart/checkout-summary
router.get("/checkout-summary", getCartCheckoutSummary);

// DELETE /api/cart/clear
router.delete("/clear", clearMyCart);

export default router;
