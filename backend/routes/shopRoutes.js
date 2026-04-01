import express from "express";
import Shop from "../models/Shop.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

// GET /api/shops/my
router.get("/my", verifyToken, isSeller, async (req, res) => {
  try {
    const store = await Shop.findOne({ owner: req.user.id });
    if (!store) return res.status(204).end();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/shops/:id
router.get("/:id", async (req, res) => {
  try {
    const store = await Shop.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/shops/:id/products
router.get("/:id/products", async (req, res) => {
  try {
    const store = await Shop.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/shops
router.post("/", verifyToken, isSeller, async (req, res) => {
  try {
    const existing = await Shop.findOne({ owner: req.user.id });
    if (existing) return res.status(400).json({ message: "Vous possédez déjà une boutique." });

    const { name, description, logo, banner } = req.body;
    if (!name || !description) return res.status(400).json({ message: "Name and description are required" });

    const store = await Shop.create({
      name,
      description,
      logo: logo || "",
      banner: banner || "",
      owner: req.user.id,
    });

    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/shops
router.put("/", verifyToken, isSeller, async (req, res) => {
  try {
    const store = await Shop.findOne({ owner: req.user.id });
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { name, description, logo, banner, address, category } = req.body;
    Object.assign(store, { name, description, logo, banner, address, category });
    await store.save();

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;