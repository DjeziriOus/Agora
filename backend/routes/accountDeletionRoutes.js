import express from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../auth.js";
import { verifyToken } from "../middleware/auth.js";
import { getAccountDeletionBlockReason } from "../services/accountDeletionService.js";

const router = express.Router();

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
