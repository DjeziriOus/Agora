import express from "express";
import { products, stores, generateId } from "../data/mockData.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

function findProduct(id) {
  return products.find((product) => product.id === id);
}

function findStoreByOwner(ownerId) {
  return stores.find((store) => store.ownerId === ownerId) || null;
}

router.get("/", (req, res) => {
  let items = [...products];

  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    items = items.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q),
    );
  }

  if (req.query.category) {
    const category = String(req.query.category).toLowerCase();
    items = items.filter(
      (product) => product.category.toLowerCase() === category,
    );
  }

  res.json({ products: items, total: items.length });
});

router.get("/mine", verifyToken, isSeller, (req, res) => {
  const store = findStoreByOwner(req.user.id);
  if (!store) {
    return res.json([]);
  }

  const storeProducts = products.filter(
    (product) => product.storeId === store.id,
  );
  res.json(storeProducts);
});

router.get("/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

router.post("/", verifyToken, isSeller, (req, res) => {
  const store = findStoreByOwner(req.user.id);
  if (!store) {
    return res.status(400).json({ message: "Vous devez créer une boutique avant d'ajouter des produits." });
  }

  const {
    name,
    description,
    price,
    category,
    categoryId,
    stock,
    stockThreshold,
    images,
    isActive,
  } = req.body;

  if (!name || !description || price == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const product = {
    id: generateId("prod"),
    name,
    description,
    price: Number(price),
    category: category || "Autre",
    categoryId: categoryId || "other",
    stock: Number(stock ?? 0),
    stockThreshold: Number(stockThreshold ?? 5),
    rating: 0,
    reviewCount: 0,
    storeId: store.id,
    storeName: store.name,
    images: Array.isArray(images) && images.length > 0 ? images : ["https://placehold.co/600x400?text=Produit"],
    isActive: isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  products.push(product);
  store.productCount = products.filter((item) => item.storeId === store.id).length;
  res.status(201).json(product);
});

router.put("/:id", verifyToken, isSeller, (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const store = findStoreByOwner(req.user.id);
  if (!store || product.storeId !== store.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  Object.assign(product, req.body, {
    price: req.body.price != null ? Number(req.body.price) : product.price,
    stock: req.body.stock != null ? Number(req.body.stock) : product.stock,
    stockThreshold:
      req.body.stockThreshold != null
        ? Number(req.body.stockThreshold)
        : product.stockThreshold,
  });

  res.json(product);
});

router.put("/:id/stock", verifyToken, isSeller, (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const store = findStoreByOwner(req.user.id);
  if (!store || product.storeId !== store.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { stock } = req.body;
  if (stock == null) {
    return res.status(400).json({ message: "Stock is required" });
  }

  product.stock = Number(stock);
  res.json(product);
});

router.delete("/:id", verifyToken, isSeller, (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const store = findStoreByOwner(req.user.id);
  if (!store || product.storeId !== store.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const index = products.findIndex((item) => item.id === req.params.id);
  products.splice(index, 1);
  store.productCount = products.filter((item) => item.storeId === store.id).length;
  res.status(204).end();
});

export default router;
