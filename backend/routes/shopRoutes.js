import express from "express";
import { createShop, getShopById } from "../controllers/shopController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

// POST /api/shops: Protected: seller role only
router.post("/", verifyToken, isSeller, createShop);

// GET /api/shops/:id  (public)
router.get("/:id", getShopById);

export default router;
