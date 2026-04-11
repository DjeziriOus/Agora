import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Normalizes variant identifiers so null/undefined/empty string are treated consistently.
const normalizeVariantId = (variantId) => {
  if (variantId === undefined || variantId === null) {
    return null;
  }
  const normalized = String(variantId).trim();
  return normalized.length > 0 ? normalized : null;
};

// Resolves the effective unit price for a cart item.
// If a matching variant has its own price, use it; otherwise fallback to product price.
const getItemUnitPrice = (item) => {
  const product = item.productId;
  if (!product) return 0;

  const normalizedVariantId = normalizeVariantId(item.variantId);
  if (normalizedVariantId && Array.isArray(product.variants)) {
    const variant = product.variants.find(
      (v) => normalizeVariantId(v.code) === normalizedVariantId,
    );
    if (variant && typeof variant.price === "number") {
      return variant.price;
    }
  }

  return typeof product.price === "number" ? product.price : 0;
};

/**
 * Fetches a user's cart, or creates an empty one if it does not exist.
 * Populates product and shop data so the frontend receives full item details.
 */
export const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select: "name price variants images stock isActive isDeleted shop",
    populate: { path: "shop", select: "name" },
  });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

/**
 * Adds a product to the cart, or increases its quantity if it already exists.
 * Supports product variants via variantId (e.g., size-m-black).
 */
export const addItem = async (
  userId,
  productId,
  quantity = 1,
  variantId = null,
) => {
  const normalizedVariantId = normalizeVariantId(variantId);

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

  // If variantId is provided, validate it and use variant-level stock.
  let availableStock = product.stock;
  if (normalizedVariantId) {
    const variant = Array.isArray(product.variants)
      ? product.variants.find(
          (v) => normalizeVariantId(v.code) === normalizedVariantId,
        )
      : null;

    if (!variant || variant.isActive === false) {
      const err = new Error("Variant not found or unavailable");
      err.statusCode = 404;
      throw err;
    }

    availableStock = variant.stock;
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  // Find existing item by both productId AND variantId
  const existingItem = cart.items.find(
    (item) =>
      item.productId.toString() === productId &&
      normalizeVariantId(item.variantId) === normalizedVariantId,
  );

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > availableStock) {
      const err = new Error(`Insufficient stock (${availableStock} available)`);
      err.statusCode = 400;
      throw err;
    }
    existingItem.quantity = newQty;
  } else {
    if (quantity > availableStock) {
      const err = new Error(`Insufficient stock (${availableStock} available)`);
      err.statusCode = 400;
      throw err;
    }
    cart.items.push({
      productId,
      quantity,
      variantId: normalizedVariantId,
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
  variantId = null,
) => {
  const normalizedVariantId = normalizeVariantId(variantId);

  if (quantity < 1) {
    const err = new Error("Quantity must be at least 1");
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  // Use variant stock when a variant is specified.
  let availableStock = product.stock;
  if (normalizedVariantId) {
    const variant = Array.isArray(product.variants)
      ? product.variants.find(
          (v) => normalizeVariantId(v.code) === normalizedVariantId,
        )
      : null;

    if (!variant || variant.isActive === false) {
      const err = new Error("Variant not found or unavailable");
      err.statusCode = 404;
      throw err;
    }

    availableStock = variant.stock;
  }

  if (quantity > availableStock) {
    const err = new Error(`Insufficient stock (${availableStock} available)`);
    err.statusCode = 400;
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
      normalizeVariantId(i.variantId) === normalizedVariantId,
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
export const removeItem = async (userId, productId, variantId = null) => {
  const normalizedVariantId = normalizeVariantId(variantId);

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
        normalizeVariantId(i.variantId) === normalizedVariantId
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
 * When selected=true, the item will be included in checkout.
 */
export const toggleSelected = async (userId, productId, variantId = null) => {
  const normalizedVariantId = normalizeVariantId(variantId);

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error("Cart not found");
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.find(
    (i) =>
      i.productId.toString() === productId &&
      normalizeVariantId(i.variantId) === normalizedVariantId,
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
    const unitPrice = getItemUnitPrice(item);
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
