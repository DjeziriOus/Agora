import Cart from "../models/Cart.js";
import ClientAddress from "../models/ClientAddress.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import Variant from "../models/Variant.js";

const BLOCKING_ORDER_STATUSES = [
  "en_attente",
  "en_preparation",
  "en_livraison",
];

export async function getAccountDeletionBlockReason({ userId, role }) {
  if (role === "seller") {
    const hasBlockingSellerOrders = await Order.exists({
      subOrders: {
        $elemMatch: {
          sellerId: userId,
          status: { $in: BLOCKING_ORDER_STATUSES },
        },
      },
    });

    if (hasBlockingSellerOrders) {
      return {
        code: "PENDING_SELLER_ORDERS",
        message:
          "Vous ne pouvez pas supprimer votre compte vendeur tant qu'une commande n'est pas terminée ou annulée.",
      };
    }

    return null;
  }

  const hasBlockingClientOrders = await Order.exists({
    userId,
    subOrders: {
      $elemMatch: {
        status: { $in: BLOCKING_ORDER_STATUSES },
      },
    },
  });

  if (hasBlockingClientOrders) {
    return {
      code: "PENDING_CLIENT_ORDERS",
      message:
        "Vous ne pouvez pas supprimer votre compte tant qu'une commande n'est pas terminée ou annulée.",
    };
  }

  return null;
}

export async function cleanupDeletedUserData({ userId, role }) {
  await Promise.all([
    Cart.findOneAndDelete({ userId }),
    ClientAddress.deleteMany({ user: userId }),
  ]);

  if (role !== "seller") {
    return;
  }

  const shop = await Shop.findOne({ owner: userId, isDeleted: false });

  if (!shop) {
    return;
  }

  const products = await Product.find({ shop: shop._id }).select("_id").lean();
  const productIds = products.map((product) => product._id);

  shop.isDeleted = true;
  shop.status = "inactive";
  await shop.save();

  // Keep historical order references intact while removing the catalogue from public views.
  await Product.updateMany(
    { shop: shop._id },
    { isDeleted: true, isActive: false },
  );

  if (productIds.length > 0) {
    await Variant.updateMany(
      { product: { $in: productIds } },
      { isActive: false },
    );
  }
}
