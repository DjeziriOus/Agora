import express from "express";
import { orders } from "../data/mockData.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

// Get all orders for a seller
router.get("/seller", verifyToken, isSeller, (req, res) => {
  const sellerOrders = orders.filter((order) => order.sellerId === req.user.id);
  res.json(sellerOrders);
});

// Get order by ID for seller
router.get("/seller/:id", verifyToken, isSeller, (req, res) => {
  const order = orders.find(
    (order) => order.id === req.params.id && order.sellerId === req.user.id
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

// Update order status
router.patch("/:id/status", verifyToken, isSeller, (req, res) => {
  const { status } = req.body;

  if (!["pending", "paid", "shipped", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = orders.find(
    (order) => order.id === req.params.id && order.sellerId === req.user.id
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json(order);
});

// Get all orders (buyer view)
router.get("/", verifyToken, (req, res) => {
  const userOrders = orders.filter((order) => order.userId === req.user.id);
  res.json(userOrders);
});

// Get order by ID (buyer view)
router.get("/:id", verifyToken, (req, res) => {
  const order = orders.find(
    (order) => order.id === req.params.id && order.userId === req.user.id
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

export default router;
