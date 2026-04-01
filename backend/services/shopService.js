import Shop from "../models/Shop.js";

/**
 * Create a new shop for the currently authenticated seller.
 * @param {Object} data
 * @param {string} data.ownerId
 * @param {boolean} data.emailVerified
 * @param {string} data.name
 * @param {string} data.description
 * @param {string} data.contactEmail
 * @param {string} data.contactPhone
 * @param {string} data.contactAddress
 * @param {string} data.status
 * @returns {Object} - created shop
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
}) => {
  if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !emailVerified) {
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

  const shop = await Shop.create({
    name,
    description,
    contactEmail,
    contactPhone,
    contactAddress,
    status,
    owner: ownerId,
  });

  return shop;
};
const getShopById = async (shopId) => {
  const shop = await Shop.findById(shopId).populate(
    "owner",
    "name email firstName lastName",
  );
  if (!shop) {
    const error = new Error("Shop not found.");
    error.statusCode = 404;
    throw error;
  }
  return shop;
};
const updateShop = async ({ shopId, ownerId, updateData }) => {
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

  if (updateData.name !== undefined) shop.name = updateData.name;
  if (updateData.description !== undefined)
    shop.description = updateData.description;

  await shop.save();
  return shop;
};
export default { createShop, getShopById, updateShop };
