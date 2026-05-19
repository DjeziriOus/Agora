/**
 * @file Service métier boutique vendeur.
 *
 * Une boutique appartient à un `User` (rôle vendeur). Les index uniques
 * partiels (`name`, `slug`) ignorent les boutiques `isDeleted: true` pour
 * autoriser la réutilisation du nom après suppression.
 *
 * Inclut aussi le calcul des statistiques vendeur (CA, nb commandes,
 * produits actifs, etc.) utilisé sur le dashboard.
 *
 * Voir aussi : docs/modules/backend/services-shopService.md
 */

import mongoose from "mongoose";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Variant from "../models/Variant.js";
import Order from "../models/Order.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";
import { computeAggregatesFromArray } from "./variantService.js";
import { requireEmailVerification } from "../auth.js";

// Validate a public shop identifier before it reaches the Mongoose query layer.
const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
};

// Normalize the public shop payload for the boutique storefront header.
// Consumer:
// frontend/app/(client)/boutique/[id]/page.tsx
// This provides the shop metadata plus the public product count displayed in the page summary.
const serializePublicShop = async (shop) => {
  const productCount = await Product.countDocuments({
    shop: shop._id,
    isDeleted: false,
    isActive: true,
  });
  const shopObj = shop.toJSON ? shop.toJSON() : shop;

  return {
    ...shopObj,
    productCount,
  };
};

// Enrich public shop products for storefront rendering.
// Consumer:
// frontend/app/(client)/boutique/[id]/page.tsx
// Each item is rendered through ProductCard, which requires variant data and aggregate
// fields such as displayPrice, totalStock, and hasMultiplePrices.
const enrichProductsWithVariants = async (products, { mode = "seller" } = {}) => {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product._id);
  const allVariants = await Variant.find({ product: { $in: productIds } }).sort(
    {
      createdAt: 1,
    },
  );

  const variantsByProduct = new Map();
  for (const variant of allVariants) {
    const productId = variant.product.toString();
    if (!variantsByProduct.has(productId)) {
      variantsByProduct.set(productId, []);
    }
    variantsByProduct.get(productId).push(variant);
  }

  return products.map((product) => {
    const productObj = product.toJSON ? product.toJSON() : product;
    const variants = variantsByProduct.get(product._id.toString()) || [];
    const aggregates = computeAggregatesFromArray(variants);
    const threshold = productObj.stockThreshold ?? 5;

    if (mode === "public") {
      const publicVariants = variants.map((v) => {
        const variant = v.toJSON ? v.toJSON() : v;
        const stock = Number(variant.stock ?? 0);
        const maxPerOrder = Number(variant.maxPerOrder ?? 10);
        return {
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
      });
      const totalStock = aggregates.totalStock;
      return {
        ...productObj,
        variants: publicVariants,
        displayPrice: aggregates.displayPrice,
        hasMultiplePrices: aggregates.hasMultiplePrices,
        inStock: totalStock > 0,
        lowStock: totalStock > 0 && totalStock <= threshold,
      };
    }

    return {
      ...productObj,
      variants,
      totalStock: aggregates.totalStock,
      displayPrice: aggregates.displayPrice,
      hasMultiplePrices: aggregates.hasMultiplePrices,
    };
  });
};

/**
 * Upload a single shop image (logo or banner) if a file was provided.
 * @param {Object|undefined} file — multer file object (from req.files.logo[0] or req.files.banner[0])
 * @param {"shopLogo"|"shopBanner"} preset
 * @returns {Promise<{ url: string, publicId: string } | null>}
 */
const uploadShopImage = async (file, preset) => {
  if (!file) return null;
  return uploadToCloudinary(file.buffer, preset);
};

/**
 * Replace a shop image: upload new one, delete old one from Cloudinary.
 * @param {Object|undefined} file — new file (or undefined to skip)
 * @param {{ url: string, publicId: string }} existing — current image data
 * @param {"shopLogo"|"shopBanner"} preset
 * @returns {Promise<{ url: string, publicId: string } | null>} — new image data, or null if no change
 */
const replaceShopImage = async (file, existing, preset) => {
  if (!file) return null;
  const newImage = await uploadToCloudinary(file.buffer, preset);
  // Delete old image if it existed (fire-and-forget).
  if (existing?.publicId) {
    deleteFromCloudinary(existing.publicId);
  }
  return newImage;
};

/**
 * Create a new shop for the currently authenticated seller.
 */
const createShop = async ({
  ownerId,
  emailVerified,
  name,
  description,
  contactEmail,
  contactPhone,
  contactAddress,
  status,
  files = {},
}) => {
  if (requireEmailVerification && !emailVerified) {
    const error = new Error("Email must be verified before creating a shop.");
    error.statusCode = 403;
    throw error;
  }

  const existingShop = await Shop.findOne({ owner: ownerId });
  if (existingShop) {
    const error = new Error("Seller already has a shop.");
    error.statusCode = 409;
    throw error;
  }

  const existingName = await Shop.findOne({ name, isDeleted: false }).collation(
    { locale: "en", strength: 2 },
  );
  if (existingName) {
    const error = new Error("Shop name is already taken.");
    error.statusCode = 409;
    throw error;
  }

  // Upload logo and banner if provided.
  const logo = await uploadShopImage(files.logo?.[0], "shopLogo");
  const banner = await uploadShopImage(files.banner?.[0], "shopBanner");

  const shopData = {
    name,
    description,
    contactEmail,
    contactPhone,
    contactAddress,
    status,
    owner: ownerId,
  };

  if (logo) shopData.logo = logo;
  if (banner) shopData.banner = banner;

  try {
    const shop = await Shop.create(shopData);
    return shop;
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = new Error("Shop name is already taken.");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw error;
  }
};

/**
 * GET /api/shops/:slug
 */
const getShopBySlug = async (slug) => {
  const shop = await Shop.findOne({ slug, isDeleted: false }).populate(
    "owner",
    "name email firstName lastName",
  );
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }
  return serializePublicShop(shop);
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * GET /api/shops/:slug/products
 */
const getShopProductsBySlug = async (slug, query = {}) => {
  const shop = await Shop.findOne({ slug, isDeleted: false });
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }

  const page = toSafeInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(toSafeInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filters = {
    shop: shop._id,
    isDeleted: false,
    isActive: true,
  };

  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate("shop", "name slug logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  const enriched = await enrichProductsWithVariants(products, { mode: "public" });

  return {
    products: enriched,
    total,
    page,
    limit,
  };
};

/**
 * Update an existing shop (text fields + optional logo/banner replacement).
 */
const updateShop = async ({ shopId, ownerId, updateData, files = {} }) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }
  if (shop.owner.toString() !== ownerId.toString()) {
    const error = new Error("Access denied. You do not own this shop.");
    error.statusCode = 403;
    throw error;
  }

  // Update text fields.
  if (updateData.name !== undefined) shop.name = updateData.name;
  if (updateData.description !== undefined)
    shop.description = updateData.description;
  if (updateData.contactEmail !== undefined)
    shop.contactEmail = updateData.contactEmail;
  if (updateData.contactPhone !== undefined)
    shop.contactPhone = updateData.contactPhone;
  if (updateData.contactAddress !== undefined)
    shop.contactAddress = updateData.contactAddress;

  // Replace logo if a new file was uploaded.
  const newLogo = await replaceShopImage(
    files.logo?.[0],
    shop.logo,
    "shopLogo",
  );
  if (newLogo) shop.logo = newLogo;

  // Replace banner if a new file was uploaded.
  const newBanner = await replaceShopImage(
    files.banner?.[0],
    shop.banner,
    "shopBanner",
  );
  if (newBanner) shop.banner = newBanner;

  await shop.save();
  return shop;
};

const getMyShop = async (ownerId) => {
  const shop = await Shop.findOne({ owner: ownerId }).populate(
    "owner",
    "name email firstName lastName",
  );
  return shop;
};

const getVendorStats = async (ownerId) => {
  const shop = await Shop.findOne({ owner: ownerId, isDeleted: false });
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }
  
  // Orders
  const orders = await Order.find({ "subOrders.sellerId": ownerId }).lean();
  let totalRevenue = 0;
  let totalOrders = 0;
  let pendingOrders = 0;
  
  for (const order of orders) {
    const sub = order.subOrders.find(s => s.sellerId?.toString() === ownerId.toString());
    if (sub) {
      totalOrders++;
      totalRevenue += sub.total || 0;
      if (sub.status === "en_attente") pendingOrders++;
    }
  }

  // Products
  const products = await Product.find({ shop: shop._id, isDeleted: false });
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;

  return {
    totalRevenue,
    revenueChange: 0,
    totalOrders,
    pendingOrders,
    totalProducts,
    activeProducts,
    averageRating: shop.rating || 0
  };
};

const getStockStats = async (ownerId) => {
  const shop = await Shop.findOne({ owner: ownerId, isDeleted: false });
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }
  
  const products = await Product.find({ shop: shop._id, isDeleted: false });
  const enriched = await enrichProductsWithVariants(products);
  
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const group of enriched) {
    if (group.variants && group.variants.length > 0) {
      for (const variant of group.variants) {
        if (!variant.isActive) continue;
        const stock = variant.stock;
        const threshold = group.stockThreshold ?? 5;
        if (stock <= 0) outOfStockCount++;
        else if (stock <= threshold) lowStockCount++;
        else inStockCount++;
      }
    } else {
      const stock = group.totalStock ?? 0;
      const threshold = group.stockThreshold ?? 5;
      if (stock <= 0) outOfStockCount++;
      else if (stock <= threshold) lowStockCount++;
      else inStockCount++;
    }
  }

  return { inStockCount, lowStockCount, outOfStockCount };
};

export default { createShop, getShopBySlug, getShopProductsBySlug, updateShop, getMyShop, getVendorStats, getStockStats };
