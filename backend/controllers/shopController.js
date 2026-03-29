import { createShop as createShopService } from "../services/shopService.js";

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

    const shop = await createShopService({
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