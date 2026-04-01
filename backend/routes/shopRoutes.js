import express from "express";
import { stores, products, generateId } from "../data/mockData.js";
import { verifyToken, isSeller } from "../middleware/auth.js";

const router = express.Router();

function findStore(id) {
  return stores.find((store) => store.id === id);
}

function findStoreByOwner(ownerId) {
  return stores.find((store) => store.ownerId === ownerId) || null;
}

router.get("/my", verifyToken, isSeller, (req, res) => {
  const store = findStoreByOwner(req.user.id);
  if (!store) {
    return res.status(204).end();
  }
  res.json(store);
});

router.get("/:id", (req, res) => {
  const store = findStore(req.params.id);
  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }
  res.json(store);
});

router.get("/:id/products", (req, res) => {
  const store = findStore(req.params.id);
  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }

  const storeProducts = products.filter(
    (product) => product.storeId === store.id,
  );
  res.json(storeProducts);
});

router.post("/", verifyToken, isSeller, (req, res) => {
  const existingStore = findStoreByOwner(req.user.id);
  if (existingStore) {
    return res.status(400).json({ message: "Vous possédez déjà une boutique." });
  }

  const { name, description, logo, banner } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" });
  }

  const newStore = {
    id: generateId("store"),
    ownerId: req.user.id,
    name,
    description,
    logo: logo || "https://placehold.co/200x200?text=Logo",
    banner: banner || "https://placehold.co/1200x300?text=Banner",
    productCount: 0,
    rating: 0,
    createdAt: new Date().toISOString(),
    address: {
      street: "123 Rue de l'Agora",
      city: "Paris",
      postalCode: "75000",
      country: "France",
    },
    category: "Électronique",
  };

  stores.push(newStore);
  res.status(201).json(newStore);
});

router.put("/", verifyToken, isSeller, (req, res) => {
  const store = findStoreByOwner(req.user.id);
  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }

  const { name, description, logo, banner, address, category } = req.body;
  Object.assign(store, {
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(logo !== undefined && { logo }),
    ...(banner !== undefined && { banner }),
    ...(address !== undefined && { address }),
    ...(category !== undefined && { category }),
  });

  res.json(store);
});

export default router;
