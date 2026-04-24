import shopService from "../services/shopService.js";

/**
 * POST /api/shops
 * Create a new shop (with optional logo + banner uploads).
 */
export const createShop = async (req, res) => {
  try {
    console.log(req.body);
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      contactAddress,
      status,
    } = req.body;

    const shop = await shopService.createShop({
      ownerId: req.user.id,
      emailVerified: req.user.emailVerified,
      name,
      description,
      contactEmail,
      contactPhone,
      contactAddress,
      status,
      files: req.files || {},
    });

    return res.status(201).json({
      message: "Shop created successfully.",
      shop,
    });
  } catch (error) {
    console.error("createShop error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error.",
    });
  }
};

/**
 * PUT /api/shops/:id
 * Update shop text fields and/or replace logo/banner.
 */
export const updateShop = async (req, res) => {
  try {
    const shop = await shopService.updateShop({
      shopId: req.params.id,
      ownerId: req.user.id,
      updateData: req.body,
      files: req.files || {},
    });

    return res.status(200).json({
      message: "Boutique mise à jour avec succès.",
      shop,
    });
  } catch (error) {
    console.error("updateShop error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error.",
    });
  }
};
/**
 * GET /api/shops/:slug
 */
export const getShopById = async (req, res) => {
  try {
    const shop = await shopService.getShopBySlug(req.params.slug);
    res.status(200).json(shop);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * GET /api/shops/:slug/products
 */
export const getShopProducts = async (req, res) => {
  try {
    const result = await shopService.getShopProductsBySlug(req.params.slug, req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
/**
 * GET /api/shops/my
 * Get the authenticated seller's shop.
 */
export const getMyShop = async (req, res) => {
  try {
    console.log("req.user.id", req.user.id);
    const shop = await shopService.getMyShop(req.user.id);
    res.status(200).json(shop);
  } catch (error) {
    console.error("getMyShop error:", error.message);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// /**
//  * GET /api/shops/my
//  * Get the authenticated seller's shop.
//  */
// export const getMyShop = async (req, res) => {
//   try {
//     const store = await Shop.findOne({ owner: req.user.id });
//     if (!store) return res.status(204).end();
//     res.json(store);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

/**
 * GET /api/shops/my/stats
 */
export const getVendorStats = async (req, res) => {
  try {
    const stats = await shopService.getVendorStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * GET /api/shops/my/stock-stats
 */
export const getStockStats = async (req, res) => {
  try {
    const stats = await shopService.getStockStats(req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
