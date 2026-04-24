import * as authService from '../services/authService.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

/**
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/resend-verification
 */
const resendVerificationEmail = async (req, res) => {
  try {
    await authService.resendVerificationEmail(req.user.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * PUT /api/account/profile-picture
 * Upload or replace the user's profile picture via Cloudinary.
 */
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni." });
    }

    // Upload the new avatar to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "avatar",
    );

    // Read the old publicId so we can clean it up after the update succeeds
    const existingUser = await User.findById(req.user.id).select(
      "imagePublicId",
    );
    const oldPublicId = existingUser?.imagePublicId || "";

    // Update the user document through BetterAuth so the session stays in sync
    await auth.api.updateUser({
      body: { image: url, imagePublicId: publicId },
      headers: fromNodeHeaders(req.headers),
    });

    // Delete old avatar from Cloudinary (fire-and-forget, best effort)
    if (oldPublicId) {
      deleteFromCloudinary(oldPublicId).catch(() => {});
    }

    return res.status(200).json({ image: url });
  } catch (error) {
    console.error("updateProfilePicture error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Erreur lors de la mise à jour de la photo de profil." });
  }
};

/**
 * DELETE /api/account/profile-picture
 * Remove the user's profile picture from Cloudinary and clear the image field.
 */
const deleteProfilePicture = async (req, res) => {
  try {
    const existingUser = await User.findById(req.user.id).select(
      "imagePublicId image",
    );

    if (!existingUser?.image) {
      return res.status(400).json({ message: "Aucune photo de profil à supprimer." });
    }

    const oldPublicId = existingUser.imagePublicId || "";

    // Clear the image fields through BetterAuth
    await auth.api.updateUser({
      body: { image: "", imagePublicId: "" },
      headers: fromNodeHeaders(req.headers),
    });

    // Delete from Cloudinary (fire-and-forget)
    if (oldPublicId) {
      deleteFromCloudinary(oldPublicId).catch(() => {});
    }

    return res.status(200).json({ image: "" });
  } catch (error) {
    console.error("deleteProfilePicture error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Erreur lors de la suppression de la photo de profil." });
  }
};

export { getProfile, resendVerificationEmail, updateProfilePicture, deleteProfilePicture };
