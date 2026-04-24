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

export async function createOrder(userId, { items, deliveryAddress }) {
  const itemsWithData = await Promise.all(
    items.map(async ({ productId, variantId, quantity }) => {
      const product = await Product.findById(productId).populate('shop').lean();
      if (!product || product.isDeleted) {
        throw new Error(`Produit introuvable: ${productId}`);
      }
      const shop = product.shop;
      if (!shop) {
        throw new Error(`Boutique introuvable pour le produit: ${productId}`);
      }

      let variant = null;
      if (variantId) {
        variant = await Variant.findById(variantId).lean();
      }
      if (!variant) {
        variant = await Variant.findOne({ product: productId, isActive: true }).lean();
      }
      if (!variant) {
        throw new Error(`Variante introuvable pour le produit: ${productId}`);
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

  await order.save();
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

  sub.status = status;

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
