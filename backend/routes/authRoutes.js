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
import mongoose from "mongoose";
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
import {
  cleanupDeletedUserData,
  getAccountDeletionBlockReason,
} from "../services/accountDeletionService.js";
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

// Normalise un email pour comparaison (trim + lowercase).
const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

router.post("/delete-check", verifyToken, async (req, res) => {
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  const emailConfirm = normalizeEmail(req.body?.email);

  try {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const credentialAccount = accounts.find(
      (account) => account.providerId === "credential",
    );

    // ── Cas 1 : pas de mot de passe (compte Google OAuth uniquement) ──────────
    // On valide la suppression en demandant à l'utilisateur de retaper son
    // propre email (pas de mdp à vérifier).
    if (!credentialAccount) {
      if (!emailConfirm) {
        return res.status(400).json({
          code: "EMAIL_REQUIRED",
          message:
            "Veuillez confirmer votre adresse e-mail pour continuer la suppression.",
        });
      }
      if (normalizeEmail(req.user.email) !== emailConfirm) {
        return res.status(400).json({
          code: "EMAIL_MISMATCH",
          message: "L'adresse e-mail saisie ne correspond pas à celle du compte.",
        });
      }
    } else {
      // ── Cas 2 : compte avec mot de passe ────────────────────────────────────
      if (!password) {
        return res.status(400).json({
          code: "PASSWORD_REQUIRED",
          message: "Le mot de passe actuel est obligatoire pour continuer.",
        });
      }
      await auth.api.verifyPassword({
        body: { password },
        headers: fromNodeHeaders(req.headers),
      });
    }

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

/**
 * Supprime un compte n'ayant PAS de mot de passe (Google OAuth uniquement).
 *
 * `authClient.deleteUser()` côté frontend exige un mot de passe pour les
 * comptes credential — il n'a pas de chemin natif pour les comptes OAuth
 * sans password. On gère donc la suppression côté backend après avoir
 * revalidé l'email + l'absence de commandes vivantes, puis on nettoie les
 * collections Better Auth (user / accounts / sessions) directement.
 *
 * Route : `POST /api/account/delete-oauth`
 *
 * @swagger
 * /api/account/delete-oauth:
 *   post:
 *     tags: [Account]
 *     summary: (OAuth-only) Supprime le compte après confirmation par email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Compte supprimé }
 *       400: { description: "EMAIL_MISMATCH ou compte avec mot de passe" }
 */
router.post("/delete-oauth", verifyToken, async (req, res) => {
  const emailConfirm = normalizeEmail(req.body?.email);

  if (!emailConfirm) {
    return res.status(400).json({
      code: "EMAIL_REQUIRED",
      message: "Veuillez confirmer votre adresse e-mail pour supprimer le compte.",
    });
  }

  if (normalizeEmail(req.user.email) !== emailConfirm) {
    return res.status(400).json({
      code: "EMAIL_MISMATCH",
      message: "L'adresse e-mail saisie ne correspond pas à celle du compte.",
    });
  }

  try {
    // Defense-in-depth : refuse si l'utilisateur a un mot de passe (il doit
    // passer par le flow `authClient.deleteUser` standard).
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const hasCredential = accounts.some((a) => a.providerId === "credential");
    if (hasCredential) {
      return res.status(400).json({
        code: "PASSWORD_REQUIRED",
        message:
          "Ce compte a un mot de passe — utilisez le flow standard de suppression.",
      });
    }

    const userId = req.user.id;
    const role = typeof req.user.role === "string" ? req.user.role : "buyer";

    // Refus si commandes en cours.
    const blockReason = await getAccountDeletionBlockReason({ userId, role });
    if (blockReason) {
      return res.status(400).json(blockReason);
    }

    // 1) Cleanup applicatif (cart, addresses, shop+products si vendeur).
    await cleanupDeletedUserData({ userId, role });

    // 2) Suppression des enregistrements Better Auth.
    const db = mongoose.connection.db;
    await db.collection("sessions").deleteMany({ userId });
    await db.collection("accounts").deleteMany({ userId });
    await db.collection("user").deleteOne({ _id: userId });

    return res.status(200).json({ status: true });
  } catch (error) {
    console.error("[delete-oauth] failed:", error);
    return res.status(500).json({
      code: "DELETE_OAUTH_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le compte.",
    });
  }
});

export default router;
