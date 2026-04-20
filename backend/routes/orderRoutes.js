import express from 'express';
import { verifyToken, isSeller } from '../middleware/auth.js';
import {
  createOrder,
  getClientOrders,
  getClientOrderById,
  getSellerOrders,
  getSellerOrderById,
  updateSubOrderStatus,
} from '../services/orderService.js';

const router = express.Router();

// POST /api/orders - Create order (buyer)
router.post('/', verifyToken, async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/client - All orders for the logged-in buyer
router.get('/client', verifyToken, async (req, res) => {
  try {
    const orders = await getClientOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/client/:id - Single buyer order detail
router.get('/client/:id', verifyToken, async (req, res) => {
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
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await getClientOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
