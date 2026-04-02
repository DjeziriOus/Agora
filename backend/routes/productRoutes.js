import express from "express";
import {
	getProducts,
	getMyProducts,
	updateProductStock,
} from "../controllers/productController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

// Public products listing/search endpoint.
router.get("/", getProducts);

// Seller inventory listing with search/filter/pagination.
router.get("/mine", verifyToken, isSeller, getMyProducts);

// Seller stock management endpoint.
router.patch("/:id/stock", verifyToken, isSeller, updateProductStock);

export default router;
