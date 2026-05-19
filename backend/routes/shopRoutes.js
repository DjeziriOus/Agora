/**
 * @file Routes boutiques — création/édition (vendeur) + consultation publique.
 * Voir aussi : docs/modules/backend/routes-shopRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Shops
 *     description: Boutiques vendeurs + statistiques dashboard
 *
 * @swagger
 * /api/shops:
 *   post:
 *     tags: [Shops]
 *     summary: (Vendeur) Crée sa boutique avec logo + bannière
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               logo: { type: string, format: binary }
 *               banner: { type: string, format: binary }
 *     responses: { 201: { description: Boutique créée } }
 *
 * /api/shops/{id}:
 *   put:
 *     tags: [Shops]
 *     summary: (Vendeur) Met à jour sa boutique
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Boutique mise à jour } }
 *
 * /api/shops/my:
 *   get:
 *     tags: [Shops]
 *     summary: (Vendeur) Récupère sa boutique
 *     responses: { 200: { description: Boutique } }
 *
 * /api/shops/my/stats:
 *   get:
 *     tags: [Shops]
 *     summary: (Vendeur) Statistiques globales (CA, commandes, clients)
 *     responses: { 200: { description: Stats } }
 *
 * /api/shops/my/stock-stats:
 *   get:
 *     tags: [Shops]
 *     summary: (Vendeur) Statistiques d'inventaire (stock bas, ruptures)
 *     responses: { 200: { description: Stats stock } }
 *
 * /api/shops/{slug}:
 *   get:
 *     tags: [Shops]
 *     summary: Page publique d'une boutique par slug
 *     parameters: [{ in: path, name: slug, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Boutique publique } }
 *
 * /api/shops/{slug}/products:
 *   get:
 *     tags: [Shops]
 *     summary: Produits publics d'une boutique
 *     parameters: [{ in: path, name: slug, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Liste produits } }
 */

import express from "express";
import {
  createShop,
  updateShop,
  getShopById,
  getMyShop,
  getShopProducts,
  getVendorStats,
  getStockStats,
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

// GET /api/shops/my/stats
router.get("/my/stats", verifyToken, isSeller, getVendorStats);

// GET /api/shops/my/stock-stats
router.get("/my/stock-stats", verifyToken, isSeller, getStockStats);

// GET /api/shops/:slug/products  (public)
router.get("/:slug/products", getShopProducts);

// GET /api/shops/:slug  (public)
router.get("/:slug", getShopById);

export default router;
