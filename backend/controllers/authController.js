/**
 * @file Handlers HTTP des routes `/api/account/*` (profil utilisateur).
 *
 * Délègue toute la logique métier à {@link module:services/authService} et
 * passe par Better Auth pour les mises à jour de profil (afin que la session
 * reste synchronisée).
 *
 * Voir aussi : docs/modules/backend/controllers-authController.md
 */

import * as authService from '../services/authService.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

/**
 * Renvoie le profil de l'utilisateur connecté, augmenté de `hasPassword`
 * (true si l'utilisateur a un compte credential Better Auth — false pour
 * les comptes créés uniquement via Google OAuth).
 *
 * Route : `GET /api/account/me`
 *
 * @param {import('express').Request} req - `req.user` est posé par {@link verifyToken}.
 * @param {import('express').Response} res
 */
const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);

    // Détecte si l'utilisateur a défini un mot de passe (credential account).
    // Les comptes Google-only n'ont qu'un account `providerId: "google"` →
    // hasPassword = false → le frontend cache "changer le mdp" et bascule la
    // suppression de compte vers la validation par email.
    const credentialAccount = await mongoose.connection.db
      .collection("accounts")
      .findOne({ userId: req.user.id, providerId: "credential" });

    const userObj = user.toObject ? user.toObject() : user;
    userObj.hasPassword = !!credentialAccount;

    res.status(200).json(userObj);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Renvoie un nouvel email de vérification à l'utilisateur connecté.
 *
 * Route : `POST /api/account/resend-verification`
 *
 * Protégée par le rate limiter {@link module:middleware/rateLimiter.resendLimiter}.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
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
 * Upload ou remplace la photo de profil de l'utilisateur.
 *
 * Séquence :
 *   1. Vérifie qu'un fichier est présent (sinon 400).
 *   2. Upload du nouveau fichier sur Cloudinary (preset "avatar").
 *   3. Lit l'ancien `imagePublicId` pour le nettoyer après.
 *   4. Met à jour le user via Better Auth (synchronise la session).
 *   5. Supprime l'ancienne image de Cloudinary (fire-and-forget).
 *
 * Route : `PUT /api/account/profile-picture`
 *
 * @param {import('express').Request} req - `req.file` posé par le middleware multer.
 * @param {import('express').Response} res
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

    // Mise à jour via Better Auth pour que la session reflète la nouvelle image.
    await auth.api.updateUser({
      body: { image: url, imagePublicId: publicId },
      headers: fromNodeHeaders(req.headers),
    });

    // Suppression best-effort de l'ancien avatar Cloudinary (n'attend pas le retour).
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
 * Supprime la photo de profil de l'utilisateur (Cloudinary + base).
 *
 * Route : `DELETE /api/account/profile-picture`
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
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

    // Reset des champs image via Better Auth.
    await auth.api.updateUser({
      body: { image: "", imagePublicId: "" },
      headers: fromNodeHeaders(req.headers),
    });

    // Suppression best-effort de l'image Cloudinary.
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
