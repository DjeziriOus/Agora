/**
 * @file Routes produits — public + espace vendeur.
 * Voir aussi : docs/modules/backend/routes-productRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Products
 *     description: Catalogue produits (listing public + gestion vendeur)
 */

import express from "express";
import {
	createProduct,
	updateProduct,
	deleteProduct,
	getProducts,
	getProductById,
	getMyProductById,
	getMyProducts,
} from "../controllers/productController.js";
import { verifyToken, isSeller } from "../middleware/auth.js";
import { uploadProductImages } from "../middleware/upload.js";

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Liste publique des produits (recherche, filtre, pagination)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Liste paginée }
 *   post:
 *     tags: [Products]
 *     summary: (Vendeur) Crée un produit avec variantes et images
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               variants: { type: string, description: "JSON stringifié" }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Produit créé }
 */
router.get("/", getProducts);
router.post("/", verifyToken, isSeller, uploadProductImages, createProduct);

/**
 * @swagger
 * /api/products/mine:
 *   get:
 *     tags: [Products]
 *     summary: (Vendeur) Liste les produits de la boutique connectée
 *     security: [{ cookieAuth: [] }]
 *     responses: { 200: { description: Inventaire vendeur } }
 */
router.get("/mine", verifyToken, isSeller, getMyProducts);

/**
 * @swagger
 * /api/products/mine/{id}:
 *   get:
 *     tags: [Products]
 *     summary: (Vendeur) Détail d'un produit avec stock réel (page d'édition)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses: { 200: { description: Produit + variantes } }
 */
router.get("/mine/:id", verifyToken, isSeller, getMyProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Détail public d'un produit (stock réel masqué)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses: { 200: { description: Produit sanitizé } }
 *   put:
 *     tags: [Products]
 *     summary: (Vendeur) Met à jour un produit
 *     security: [{ cookieAuth: [] }]
 *     responses: { 200: { description: Produit mis à jour } }
 *   delete:
 *     tags: [Products]
 *     summary: (Vendeur) Soft delete d'un produit
 *     security: [{ cookieAuth: [] }]
 *     responses: { 200: { description: Produit supprimé } }
 */
router.get("/:id", getProductById);
router.put("/:id", verifyToken, isSeller, uploadProductImages, updateProduct);
router.delete("/:id", verifyToken, isSeller, deleteProduct);

export default router;
