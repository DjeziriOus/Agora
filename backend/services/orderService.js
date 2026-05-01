import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Variant from '../models/Variant.js';
import User from '../models/User.js';

function serializeOrderForClient(order) {
  return {
    id: order._id.toString(),
    status: order.status,
    total: order.totalPrice,
    createdAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    paymentMethod: 'card',
    shippingCost: 0,
    subOrders: (order.subOrders || []).map((sub) => ({
      id: sub._id.toString(),
      orderId: order._id.toString(),
      status: sub.status,
      total: sub.total,
      store: { id: sub.shopId?.toString(), name: sub.shopName },
      items: (sub.items || []).map((item) => ({
        id: item._id.toString(),
        product: {
          id: item.productId?.toString(),
          name: item.productName,
          images: item.productImage ? [item.productImage] : [],
        },
        quantity: item.quantity,
        priceAtPurchase: item.unitPrice,
      })),
    })),
  };
}

function serializeSubOrderForList(order, sub) {
  return {
    id: sub._id.toString(),
    status: sub.status,
    total: sub.total,
    createdAt: order.createdAt,
    items: (sub.items || []).map((item) => ({
      id: item._id.toString(),
      quantity: item.quantity,
    })),
  };
}

async function serializeSubOrderForDetail(order, sub) {
  const user = await User.findById(order.userId)
    .select('firstName lastName email')
    .lean();

  return {
    id: sub._id.toString(),
    status: sub.status,
    total: sub.total,
    createdAt: order.createdAt,
    items: (sub.items || []).map((item) => ({
      id: item._id.toString(),
      product: {
        name: item.productName,
        images: item.productImage ? [item.productImage] : [],
      },
      quantity: item.quantity,
      priceAtPurchase: item.unitPrice,
    })),
    order: {
      user: user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }
        : null,
      shippingAddress: order.shippingAddress,
    },
  };
}

// Build an error with the structured fields the controller passes through.
const stockError = (message, { statusCode = 400, code, maxAllowed, productId } = {}) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  if (maxAllowed !== undefined) err.maxAllowed = maxAllowed;
  if (productId) err.productId = productId;
  return err;
};

export async function createOrder(userId, { items, deliveryAddress }) {
  const itemsWithData = await Promise.all(
    items.map(async ({ productId, variantId, quantity }) => {
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw stockError(`Quantité invalide pour le produit: ${productId}`, { productId });
      }
      const product = await Product.findById(productId).populate('shop').lean();
      if (!product || product.isDeleted) {
        throw stockError(`Produit introuvable: ${productId}`, { statusCode: 404, productId });
      }
      const shop = product.shop;
      if (!shop) {
        throw stockError(`Boutique introuvable pour le produit: ${productId}`, {
          statusCode: 404,
          productId,
        });
      }

      let variant = null;
      if (variantId) {
        variant = await Variant.findById(variantId).lean();
      }
      if (!variant) {
        variant = await Variant.findOne({ product: productId, isActive: true }).lean();
      }
      if (!variant) {
        throw stockError(`Variante introuvable pour le produit: ${productId}`, {
          statusCode: 404,
          productId,
        });
      }

      const maxPerOrder = Number(variant.maxPerOrder ?? 10);
      if (quantity > maxPerOrder) {
        throw stockError(`La limite d'achat pour ce produit est de ${maxPerOrder}`, {
          code: 'MAX_PER_ORDER',
          maxAllowed: maxPerOrder,
          productId,
        });
      }

      const firstImage = product.images?.[0];
      const imageUrl =
        typeof firstImage === 'string' ? firstImage : (firstImage?.url || '');

      return {
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        productImage: imageUrl,
        quantity,
        unitPrice: variant.price,
        shopId: shop._id,
        shopName: shop.name,
        sellerId: shop.owner,
      };
    })
  );

  const shopGroupsMap = new Map();
  for (const item of itemsWithData) {
    const key = item.shopId.toString();
    if (!shopGroupsMap.has(key)) {
      shopGroupsMap.set(key, {
        shopId: item.shopId,
        shopName: item.shopName,
        sellerId: item.sellerId,
        items: [],
        total: 0,
      });
    }
    const group = shopGroupsMap.get(key);
    group.items.push({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    group.total += item.unitPrice * item.quantity;
  }

  const subOrders = Array.from(shopGroupsMap.values()).map((group) => ({
    shopId: group.shopId,
    shopName: group.shopName,
    sellerId: group.sellerId,
    status: 'en_attente',
    total: group.total,
    items: group.items,
  }));

  const totalPrice = subOrders.reduce((sum, sub) => sum + sub.total, 0);

  // ── Atomic stock deduction ──────────────────────────────────────────────
  // We transition stock from the variant the moment the order is "en_attente"
  // (paid + confirmed). Each $inc is conditional on the current stock being
  // at least the requested quantity, so two concurrent buyers cannot oversell
  // the same item. If any decrement fails we rebuild the previous state.
  const decremented = [];
  try {
    for (const item of itemsWithData) {
      const updated = await Variant.findOneAndUpdate(
        { _id: item.variantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        const current = await Variant.findById(item.variantId).lean();
        const remaining = Math.max(0, Number(current?.stock ?? 0));
        throw stockError(
          `Désolé, la quantité demandée n'est plus disponible (${remaining} restants pour ${item.productName})`,
          {
            code: 'INSUFFICIENT_STOCK',
            maxAllowed: remaining,
            productId: item.productId.toString(),
          }
        );
      }
      decremented.push(item);
    }
  } catch (err) {
    // Roll back any stock decrements we already applied.
    await Promise.all(
      decremented.map((d) =>
        Variant.findByIdAndUpdate(d.variantId, { $inc: { stock: d.quantity } })
      )
    );
    throw err;
  }

  const order = new Order({
    userId,
    status: 'en_attente',
    totalPrice,
    shippingAddress: {
      firstName: deliveryAddress.firstName || '',
      lastName: deliveryAddress.lastName || '',
      street: deliveryAddress.addressLine1 || deliveryAddress.street || '',
      city: deliveryAddress.city || '',
      postalCode: deliveryAddress.postalCode || '',
      country: deliveryAddress.country || 'France',
      phone: deliveryAddress.phone || '',
    },
    subOrders,
  });

  try {
    await order.save();
  } catch (err) {
    // If saving the order fails after stock was decremented, restore stock
    // so the inventory stays consistent.
    await Promise.all(
      itemsWithData.map((d) =>
        Variant.findByIdAndUpdate(d.variantId, { $inc: { stock: d.quantity } })
      )
    );
    throw err;
  }
  return serializeOrderForClient(order);
}

export async function getClientOrders(userId) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map(serializeOrderForClient);
}

export async function getClientOrderById(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) return null;
  return serializeOrderForClient(order);
}

export async function getSellerOrders(sellerId) {
  const orders = await Order.find({ 'subOrders.sellerId': sellerId })
    .sort({ createdAt: -1 })
    .lean();

  const result = [];
  for (const order of orders) {
    const sub = order.subOrders.find(
      (s) => s.sellerId?.toString() === sellerId.toString()
    );
    if (sub) result.push(serializeSubOrderForList(order, sub));
  }
  return result;
}

export async function getSellerOrderById(sellerId, subOrderId) {
  const order = await Order.findOne({ 'subOrders._id': subOrderId }).lean();
  if (!order) return null;

  const sub = order.subOrders.find(
    (s) => s._id?.toString() === subOrderId.toString()
  );
  if (!sub) return null;
  if (sub.sellerId?.toString() !== sellerId.toString()) return null;

  return serializeSubOrderForDetail(order, sub);
}

export async function updateSubOrderStatus(sellerId, subOrderId, status) {
  const order = await Order.findOne({ 'subOrders._id': subOrderId });
  if (!order) return null;

  const sub = order.subOrders.id(subOrderId);
  if (!sub) return null;
  if (sub.sellerId?.toString() !== sellerId.toString()) return null;

  const wasCancelled = sub.status === 'annulee';
  sub.status = status;

  // Idempotent restock: if the sub-order is being cancelled (and we have not
  // already restored its stock), put each item's quantity back into the
  // matching variant. The flag on the sub-order prevents double-restocking
  // if a seller toggles the status repeatedly.
  if (status === 'annulee' && !wasCancelled && !sub.stockRestored) {
    await Promise.all(
      (sub.items || []).map((item) =>
        item.variantId
          ? Variant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } })
          : Promise.resolve()
      )
    );
    sub.stockRestored = true;
  }

  const allStatuses = order.subOrders.map((s) => s.status);
  if (allStatuses.every((s) => s === 'livree')) {
    order.status = 'livree';
  } else if (allStatuses.every((s) => s === 'annulee')) {
    order.status = 'annulee';
  } else if (allStatuses.some((s) => s === 'en_livraison')) {
    order.status = 'en_livraison';
  } else if (allStatuses.some((s) => s === 'en_preparation')) {
    order.status = 'en_preparation';
  }

  await order.save();

  const updatedOrder = await Order.findById(order._id).lean();
  const updatedSub = updatedOrder.subOrders.find(
    (s) => s._id?.toString() === subOrderId.toString()
  );
  return serializeSubOrderForList(updatedOrder, updatedSub);
}
