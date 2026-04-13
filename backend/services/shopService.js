import Shop from "../models/Shop.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

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
 * GET /api/shops/:id
 */
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
  if (!shop) {
    const error = new Error(
      "Vous n'avez pas encore de boutique, créez-en une pour commencer à vendre !",
    );
    error.statusCode = 404;
    throw error;
  }
  return shop;
};

export default { createShop, getShopById, updateShop, getMyShop };
