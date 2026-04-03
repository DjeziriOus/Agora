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
 * GET /api/shops/:id
 */
export const getShopById = async (req, res) => {
  try {
    const shop = await shopService.getShopById(req.params.id);
    res.status(200).json(shop);
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
    const shop = await shopService.getMyShop(req.user.id);
    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
