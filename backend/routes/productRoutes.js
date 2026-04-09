import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getProducts,
	getProductById,
	getMyProductById,
	getMyProducts,
	updateProductStock,
} from "../controllers/productController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";
import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

// Public products listing/search endpoint.
router.get("/", getProducts);

// Seller: create a new product (multipart/form-data with images).
router.post("/", verifyToken, isSeller, uploadProductImages, createProduct);

// Seller inventory listing with search/filter/pagination.
router.get("/mine", verifyToken, isSeller, getMyProducts);

// Seller detail endpoint for the edit page.
router.get("/mine/:id", verifyToken, isSeller, getMyProductById);

// Public product detail endpoint for the product page.
router.get("/:id", getProductById);

// Seller: update product text fields + manage images.
router.put("/:id", verifyToken, isSeller, uploadProductImages, updateProduct);

// Seller: soft-delete a product + cleanup Cloudinary images.
router.delete("/:id", verifyToken, isSeller, deleteProduct);

// Seller stock management endpoint.
router.patch("/:id/stock", verifyToken, isSeller, updateProductStock);

export default router;
