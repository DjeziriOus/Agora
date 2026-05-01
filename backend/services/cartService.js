import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";

/**
 * Strip raw variant stock from a populated cart item so the client never
 * sees the exact inventory count. Returns a plain object exposing only
 * inStock / lowStock / maxPurchasable.
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
 * Fetches a user's cart, or creates an empty one if it does not exist.
 * Populates product, variant, and shop data so the frontend receives full item details.
 * Raw stock is stripped before returning to the client.
 */
export const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      select: "name description category images isActive isDeleted shop stockThreshold",
      populate: { path: "shop", select: "name" },
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
 * Resolve a variant for a product.
 * If variantId is given (as ObjectId string), validate it.
 * Otherwise, auto-resolve to the first active variant.
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
 * Adds a product to the cart, or increases its quantity if it already exists.
 * Uses the Variant collection for stock checks and price resolution.
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
 * Updates the quantity of an existing cart item.
 * Must match both productId and variantId.
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
 * Removes one item from the cart by productId and variantId.
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
 * Toggles the selected status of a cart item.
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
 * Returns a checkout summary computed from selected cart items only.
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
 * Clears the entire cart, typically after order creation.
 */
export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
};
