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
export const createShop = async ({
  ownerId,
  emailVerified,
  name,
  description,
  contactEmail,
  contactPhone,
  contactAddress,
  status,
}) => {
  if (
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
    !emailVerified
  ) {
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