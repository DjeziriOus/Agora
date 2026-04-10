import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Fail fast when an id is not a valid Mongo ObjectId.
const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
};

// Resolve an active product or throw 404.
const getActiveProductOrThrow = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true,
  }).populate("shop", "name");

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

// Return the user's cart (creates an empty one if it doesn't exist yet),
// with product details populated.
const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name price images stock isActive isDeleted shop",
    populate: { path: "shop", select: "name" },
  });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

// Add an item to the cart.
// If the product is already in the cart, the quantities are summed.
// Stock is validated against the requested total quantity.
const addItem = async (userId, productId, quantity = 1) => {
  assertObjectId(productId, "product id");

  const parsedQty = Number.parseInt(quantity, 10);
  if (!Number.isInteger(parsedQty) || parsedQty < 1) {
    const error = new Error("quantity must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  const product = await getActiveProductOrThrow(productId);

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existing = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  const newQty = existing ? existing.quantity + parsedQty : parsedQty;

  if (newQty > product.stock) {
    const error = new Error(
      `Stock insuffisant. Disponible\u00a0: ${product.stock}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.items.push({ productId, quantity: parsedQty });
  }

  await cart.save();

  return getCart(userId);
};

// Update the quantity of an existing cart item.
// Passing quantity = 0 removes the item.
const updateItem = async (userId, productId, quantity) => {
  assertObjectId(productId, "product id");

  const parsedQty = Number.parseInt(quantity, 10);
  if (!Number.isInteger(parsedQty) || parsedQty < 0) {
    const error = new Error("quantity must be a non-negative integer.");
    error.statusCode = 400;
    throw error;
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    throw error;
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (itemIndex === -1) {
    const error = new Error("Item not found in cart.");
    error.statusCode = 404;
    throw error;
  }

  if (parsedQty === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await getActiveProductOrThrow(productId);

    if (parsedQty > product.stock) {
      const error = new Error(
        `Stock insuffisant. Disponible\u00a0: ${product.stock}.`,
      );
      error.statusCode = 400;
      throw error;
    }

    cart.items[itemIndex].quantity = parsedQty;
  }

  await cart.save();

  return getCart(userId);
};

// Remove a single item from the cart.
const removeItem = async (userId, productId) => {
  assertObjectId(productId, "product id");

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    throw error;
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (itemIndex === -1) {
    const error = new Error("Item not found in cart.");
    error.statusCode = 404;
    throw error;
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  return getCart(userId);
};

// Remove all items from the cart.
const clearCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [] } },
    { new: true, upsert: true },
  );

  return cart;
};

export default { getCart, addItem, updateItem, removeItem, clearCart };
