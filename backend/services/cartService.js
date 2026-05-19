/**
 * @file Service métier du panier acheteur.
 *
 * Toutes les méthodes exposées garantissent que le STOCK RÉEL n'est jamais
 * renvoyé au client (acheteur) — il est remplacé par les flags `inStock`,
 * `lowStock`, et la valeur `maxPurchasable = min(stock, maxPerOrder)`.
 *
 * Erreurs structurées émises :
 *   - `MAX_PER_ORDER` (400) + `maxAllowed`
 *   - `INSUFFICIENT_STOCK` (400) + `maxAllowed`
 *
 * Voir aussi : docs/modules/backend/services-cartService.md
 */

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";

/**
 * Sanitize une variante peuplée d'un item panier pour masquer le stock réel.
 *
 * @param {import('mongoose').Document|null} variantDoc - Document Variant peuplé.
 * @param {number} [productThreshold=5] - Seuil de stock bas du produit parent.
 * @returns {Object|null} Variant sanitizé (sans `stock` brut) ou null.
 */
const sanitizeCartVariant = (variantDoc, productThreshold) => {
  if (!variantDoc) return null;
  const variant = variantDoc.toJSON ? variantDoc.toJSON() : variantDoc;
  const stock = Number(variant.stock ?? 0);
  const maxPerOrder = Number(variant.maxPerOrder ?? 10);
  const threshold = Number(productThreshold ?? 5);

  return {
    _id: variant._id ?? variant.id,
    id: variant.id ?? variant._id?.toString?.() ?? "",
    code: variant.code,
    name: variant.name,
    sku: variant.sku ?? "",
    price: variant.price,
    attributes: variant.attributes ?? {},
    isActive: variant.isActive !== false,
    maxPerOrder,
    maxPurchasable: Math.max(0, Math.min(stock, maxPerOrder)),
    inStock: stock > 0,
    lowStock: stock > 0 && stock <= threshold,
  };
};

const sanitizeCart = (cart) => {
  if (!cart) return cart;
  const cartObj = cart.toJSON ? cart.toJSON() : cart;
  const items = (cartObj.items ?? []).map((item) => {
    const product = item.productId;
    const threshold =
      product && typeof product === "object" ? product.stockThreshold : 5;
    return {
      ...item,
      variantId: sanitizeCartVariant(item.variantId, threshold),
    };
  });
  return { ...cartObj, items };
};

/**
 * Récupère le panier d'un utilisateur (le crée vide s'il n'existe pas).
 * Peuple les produits, variantes, et boutiques. Le stock réel est masqué.
 *
 * @param {string} userId - ID Better Auth de l'acheteur.
 * @returns {Promise<Object>} Panier sanitizé prêt pour le frontend.
 */
export const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      select: "name description category images isActive isDeleted shop stockThreshold",
      populate: { path: "shop", select: "name slug" },
    })
    .populate({
      path: "items.variantId",
      select: "code name sku price stock maxPerOrder attributes isActive",
    });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return sanitizeCart(cart);
};

/**
 * Résout la variante à ajouter au panier.
 * Si un `variantId` est fourni : vérifie qu'il existe et appartient au produit.
 * Sinon : retourne la première variante active du produit (fallback).
 *
 * @param {import('mongoose').Document} product
 * @param {string|null} variantId
 * @returns {Promise<import('mongoose').Document>}
 */
const resolveVariant = async (product, variantId) => {
  if (variantId) {
    const variant = await Variant.findOne({
      _id: variantId,
      product: product._id,
      isActive: true,
    });

    if (!variant) {
      const err = new Error("Variant not found or unavailable");
      err.statusCode = 404;
      throw err;
    }

    return variant;
  }

  // Auto-resolve to first active variant
  const defaultVariant = await Variant.findOne({
    product: product._id,
    isActive: true,
  }).sort({ createdAt: 1 });

  if (!defaultVariant) {
    const err = new Error("No active variant available for this product");
    err.statusCode = 404;
    throw err;
  }

  return defaultVariant;
};

/**
 * Ajoute un produit au panier — ou incrémente sa quantité s'il y est déjà.
 * Effectue les vérifications de stock et de `maxPerOrder` avant écriture.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {number} [quantity=1]
 * @param {string|null} [variantId=null]
 * @returns {Promise<Object>} Panier complet sanitizé.
 * @throws {Error} avec `code: "MAX_PER_ORDER"` ou `"INSUFFICIENT_STOCK"`.
 */
export const addItem = async (
  userId,
  productId,
  quantity = 1,
  variantId = null,
) => {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isActive: true,
  });
  if (!product) {
    const err = new Error("Product not found or unavailable");
    err.statusCode = 404;
    throw err;
  }

  const variant = await resolveVariant(product, variantId);

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  // Find existing item by both productId AND variantId
  const existingItem = cart.items.find(
    (item) =>
      item.productId.toString() === productId &&
      item.variantId.toString() === variant._id.toString(),
  );

  const maxPerOrder = Number(variant.maxPerOrder ?? 10);

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > maxPerOrder) {
      const err = new Error(`La limite d'achat pour ce produit est de ${maxPerOrder}`);
      err.statusCode = 400;
      err.code = "MAX_PER_ORDER";
      err.maxAllowed = maxPerOrder;
      throw err;
    }
    if (newQty > variant.stock) {
      const err = new Error(
        `Désolé, la quantité demandée n'est plus disponible (${variant.stock} restants)`,
      );
      err.statusCode = 400;
      err.code = "INSUFFICIENT_STOCK";
      err.maxAllowed = variant.stock;
      throw err;
    }
    existingItem.quantity = newQty;
  } else {
    if (quantity > maxPerOrder) {
      const err = new Error(`La limite d'achat pour ce produit est de ${maxPerOrder}`);
      err.statusCode = 400;
      err.code = "MAX_PER_ORDER";
      err.maxAllowed = maxPerOrder;
      throw err;
    }
    if (quantity > variant.stock) {
      const err = new Error(
        `Désolé, la quantité demandée n'est plus disponible (${variant.stock} restants)`,
      );
      err.statusCode = 400;
      err.code = "INSUFFICIENT_STOCK";
      err.maxAllowed = variant.stock;
      throw err;
    }
    cart.items.push({
      productId,
      variantId: variant._id,
      quantity,
      selected: true,
    });
  }

  await cart.save();
  return getCart(userId);
};

/**
 * Modifie la quantité d'un item du panier.
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity
 * @param {string} variantId
 * @returns {Promise<Object>}
 */
export const updateQuantity = async (
  userId,
  productId,
  quantity,
  variantId,
) => {
  if (quantity < 1) {
    const err = new Error("Quantity must be at least 1");
    err.statusCode = 400;
    throw err;
  }

  // Validate variant and check stock
  const variant = await Variant.findById(variantId);
  if (!variant) {
    const err = new Error("Variant not found");
    err.statusCode = 404;
    throw err;
  }

  const maxPerOrder = Number(variant.maxPerOrder ?? 10);

  if (quantity > maxPerOrder) {
    const err = new Error(`La limite d'achat pour ce produit est de ${maxPerOrder}`);
    err.statusCode = 400;
    err.code = "MAX_PER_ORDER";
    err.maxAllowed = maxPerOrder;
    throw err;
  }
  if (quantity > variant.stock) {
    const err = new Error(
      `Désolé, la quantité demandée n'est plus disponible (${variant.stock} restants)`,
    );
    err.statusCode = 400;
    err.code = "INSUFFICIENT_STOCK";
    err.maxAllowed = variant.stock;
    throw err;
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.find(
    (i) =>
      i.productId.toString() === productId &&
      i.variantId.toString() === variantId,
  );
  if (!item) {
    const err = new Error("Item not found in cart");
    err.statusCode = 404;
    throw err;
  }

  item.quantity = quantity;
  await cart.save();
  return getCart(userId);
};

/**
 * Retire un item du panier (matche sur productId + variantId).
 * @param {string} userId
 * @param {string} productId
 * @param {string} variantId
 * @returns {Promise<Object>}
 */
export const removeItem = async (userId, productId, variantId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const beforeCount = cart.items.length;
  cart.items = cart.items.filter(
    (i) =>
      !(
        i.productId.toString() === productId &&
        i.variantId.toString() === variantId
      ),
  );

  if (cart.items.length === beforeCount) {
    const err = new Error("Item not found in cart");
    err.statusCode = 404;
    throw err;
  }

  await cart.save();
  return getCart(userId);
};

/**
 * Bascule le flag `selected` d'un item (coché = sera commandé au checkout).
 * @param {string} userId
 * @param {string} productId
 * @param {string} variantId
 * @returns {Promise<Object>}
 */
export const toggleSelected = async (userId, productId, variantId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.find(
    (i) =>
      i.productId.toString() === productId &&
      i.variantId.toString() === variantId,
  );
  if (!item) {
    const err = new Error("Item not found in cart");
    err.statusCode = 404;
    throw err;
  }

  item.selected = !item.selected;
  await cart.save();
  return getCart(userId);
};

/**
 * Calcule un résumé checkout à partir des items SÉLECTIONNÉS uniquement.
 *
 * @param {string} userId
 * @returns {Promise<{selectedItems: Array, subtotal: number, itemCount: number}>}
 */
export const getCheckoutSummary = async (userId) => {
  const cart = await getCart(userId);

  const selectedItems = cart.items.filter((item) => item.selected === true);

  const subtotal = selectedItems.reduce((sum, item) => {
    const unitPrice = item.variantId?.price ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    selectedItems,
    subtotal,
    itemCount,
  };
};

/**
 * Vide tous les items du panier. Appelé typiquement après une commande réussie.
 * Silencieux si le panier n'existe pas (ne lance pas d'erreur).
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
};
