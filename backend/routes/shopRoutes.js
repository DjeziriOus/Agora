import express from "express";
import { createShop } from "../controllers/shopController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

// Protected: seller role only
router.post("/", verifyToken, isSeller, createShop);

export default router;