/**
 * @file Routes "compte" — profil, photo, vérification email, check pré-suppression.
 *
 * NOTE : l'authentification proprement dite (signup/signin/signout/session) est
 * gérée par Better Auth sur `/api/auth/*`, exposé via `toNodeHandler` dans
 * server.js. Ces routes-ci sont des extensions métier (montées sur /api/account).
 *
 * Voir aussi : docs/modules/backend/routes-authRoutes.md
 *
 * @swagger
 * tags:
 *   - name: Account
 *     description: Profil utilisateur, photo, vérification email, suppression
 *
 * @swagger
 * /api/account/me:
 *   get:
 *     tags: [Account]
 *     summary: Profil de l'utilisateur connecté
 *     responses: { 200: { description: Profil } }
 *
 * /api/account/profile-picture:
 *   put:
 *     tags: [Account]
 *     summary: Met à jour la photo de profil
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses: { 200: { description: URL mise à jour } }
 *   delete:
 *     tags: [Account]
 *     summary: Supprime la photo de profil
 *     responses: { 200: { description: OK } }
 *
 * /api/account/resend-verification:
 *   post:
 *     tags: [Account]
 *     summary: Renvoie l'email de vérification (rate-limited)
 *     responses: { 200: { description: OK }, 429: { description: Trop de demandes } }
 *
 * /api/account/delete-check:
 *   post:
 *     tags: [Account]
 *     summary: Vérifie qu'un compte peut être supprimé (mdp + pas de commandes vivantes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200: { description: Suppression autorisée }
 *       400: { description: "INVALID_PASSWORD ou ORDERS_PENDING" }
 */

import express from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import {
  getProfile,
  resendVerificationEmail,
  updateProfilePicture,
  deleteProfilePicture,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import { resendLimiter } from "../middleware/rateLimiter.js";
import { getAccountDeletionBlockReason } from "../services/accountDeletionService.js";
const router = express.Router();
router.get("/me", verifyToken, getProfile);

// ── Profile Picture ──────────────────────────────────────────────────────────
router.put("/profile-picture", verifyToken, uploadAvatar, updateProfilePicture);
router.delete("/profile-picture", verifyToken, deleteProfilePicture);

router.post(
  "/resend-verification",
  resendLimiter,
  verifyToken,
  resendVerificationEmail,
);

router.post("/delete-check", verifyToken, async (req, res) => {
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!password) {
    return res.status(400).json({
      code: "PASSWORD_REQUIRED",
      message: "Le mot de passe actuel est obligatoire pour continuer.",
    });
  }

  try {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const credentialAccount = accounts.find(
      (account) => account.providerId === "credential",
    );

    if (!credentialAccount) {
      return res.status(400).json({
        code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
        message:
          "Ce compte n'utilise pas encore de mot de passe. Définissez-en un avant de pouvoir supprimer le compte.",
      });
    }

    await auth.api.verifyPassword({
      body: { password },
      headers: fromNodeHeaders(req.headers),
    });

    const blockReason = await getAccountDeletionBlockReason({
      userId: req.user.id,
      role: typeof req.user.role === "string" ? req.user.role : "buyer",
    });

    if (blockReason) {
      return res.status(400).json(blockReason);
    }

    return res.status(200).json({ status: true });
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "body" in error &&
      typeof error.body === "object" &&
      error.body !== null &&
      "code" in error.body &&
      typeof error.body.code === "string"
        ? error.body.code
        : typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof error.code === "string"
          ? error.code
          : "DELETE_ACCOUNT_CHECK_FAILED";
    const message =
      typeof error === "object" &&
      error !== null &&
      "body" in error &&
      typeof error.body === "object" &&
      error.body !== null &&
      "message" in error.body &&
      typeof error.body.message === "string"
        ? error.body.message
        : error instanceof Error
          ? error.message
          : "Impossible de vérifier la suppression du compte.";

    return res.status(code === "INVALID_PASSWORD" ? 400 : 500).json({
      code,
      message:
        code === "INVALID_PASSWORD"
          ? "Le mot de passe actuel est incorrect."
          : message,
    });
  }
});

export default router;
