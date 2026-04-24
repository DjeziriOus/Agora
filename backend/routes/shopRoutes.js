import express from "express";
import {
  createShop,
  updateShop,
  getShopById,
  getMyShop,
  getShopProducts,
} from "../controllers/shopController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";
import { uploadShopImages } from "../middleware/upload.js";

const router = express.Router();

// POST /api/shops: Create shop with optional logo + banner (seller only).
router.post("/", verifyToken, isSeller, uploadShopImages, createShop);

// PUT /api/shops/:id: Update shop text fields + replace logo/banner (seller only).
router.put("/:id", verifyToken, isSeller, uploadShopImages, updateShop);

// GET /api/shops/my
router.get("/my", verifyToken, isSeller, getMyShop);

// GET /api/shops/:slug/products  (public)
router.get("/:slug/products", getShopProducts);

// GET /api/shops/:slug  (public)
router.get("/:slug", getShopById);

export default router;
