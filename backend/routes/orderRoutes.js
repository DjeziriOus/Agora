/**
 * @file Routes commandes — acheteur (création/lecture) + vendeur (lecture/statut).
 * Voir aussi : docs/modules/backend/routes-orderRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Commandes (POST création, GET listings acheteur/vendeur, PATCH statut)
 */

import express from 'express';
import { verifyToken, isBuyer, isSeller } from '../middleware/auth.js';
import {
  createOrder,
  getClientOrders,
  getClientOrderById,
  getSellerOrders,
  getSellerOrderById,
  updateSubOrderStatus,
} from '../services/orderService.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: (Acheteur) Crée une commande à partir des items sélectionnés du panier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, deliveryAddress]
 *             properties:
 *               items: { type: array, items: { type: object } }
 *               deliveryAddress: { type: object }
 *               paymentMethod: { type: string }
 *     responses:
 *       201: { description: Commande créée }
 *       400: { description: "INSUFFICIENT_STOCK ou validation" }
 *
 * /api/orders/client:
 *   get:
 *     tags: [Orders]
 *     summary: (Acheteur) Toutes ses commandes
 *     responses: { 200: { description: Liste des commandes } }
 *
 * /api/orders/client/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: (Acheteur) Détail d'une commande
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Commande }, 404: { description: Introuvable } }
 *
 * /api/orders/seller:
 *   get:
 *     tags: [Orders]
 *     summary: (Vendeur) Toutes ses sous-commandes
 *     responses: { 200: { description: Liste } }
 *
 * /api/orders/seller/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: (Vendeur) Détail d'une sous-commande
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Sous-commande } }
 *
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: (Vendeur) Met à jour le statut d'une sous-commande
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [en_attente, en_preparation, en_livraison, livree, annulee]
 *     responses: { 200: { description: Statut mis à jour } }
 */

// POST /api/orders - Create order (buyer)
router.post('/', verifyToken, isBuyer, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Articles requis' });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ message: 'Adresse de livraison requise' });
    }
    const order = await createOrder(req.user.id, { items, deliveryAddress, paymentMethod });
    res.status(201).json(order);
  } catch (error) {
    const payload = { message: error.message };
    if (error.code) payload.code = error.code;
    if (error.maxAllowed !== undefined) payload.maxAllowed = error.maxAllowed;
    if (error.productId) payload.productId = error.productId;
    res.status(error.statusCode || 500).json(payload);
  }
});

// GET /api/orders/client - All orders for the logged-in buyer
router.get('/client', verifyToken, isBuyer, async (req, res) => {
  try {
    const orders = await getClientOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/client/:id - Single buyer order detail
router.get('/client/:id', verifyToken, isBuyer, async (req, res) => {
  try {
    const order = await getClientOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/seller - All orders for the logged-in seller
router.get('/seller', verifyToken, isSeller, async (req, res) => {
  try {
    const orders = await getSellerOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/seller/:id - Single seller sub-order detail
router.get('/seller/:id', verifyToken, isSeller, async (req, res) => {
  try {
    const order = await getSellerOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/orders/:id/status - Seller updates sub-order status
router.patch('/:id/status', verifyToken, isSeller, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    const result = await updateSubOrderStatus(req.user.id, req.params.id, status);
    if (!result) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/:id - Single buyer order (used by /compte/commandes/[id])
router.get('/:id', verifyToken, isBuyer, async (req, res) => {
  try {
    const order = await getClientOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
