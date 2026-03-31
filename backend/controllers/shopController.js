import shopService from "../services/shopService.js";
/**
 * POST /api/shops
 */
export const createShop = async (req, res) => {
  try {
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
    });

    return res.status(201).json({
      message: "Shop created successfully.",
      shop,
    });
  } catch (error) {
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
