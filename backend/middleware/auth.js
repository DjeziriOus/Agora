/**
 * @file Middlewares d'authentification et d'autorisation.
 *
 * Tous les middlewares de rôle (isSeller, isBuyer, isAdmin, requireVerifiedEmail)
 * doivent être placés APRÈS `verifyToken` dans la chaîne — sinon `req.user` est
 * `undefined`.
 *
 * Voir aussi : docs/modules/backend/middleware-auth.md
 */

import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";

/**
 * @typedef {Object} AuthenticatedUser
 * @property {string} id - Identifiant Better Auth.
 * @property {string} email
 * @property {string} name
 * @property {string} firstName
 * @property {string} lastName
 * @property {"buyer"|"seller"|"unassigned"|"admin"} role
 * @property {boolean} emailVerified
 * @property {string} [image]
 */

/**
 * Lit le cookie de session via Better Auth, attache `req.user` si valide,
 * répond 401 sinon.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const verifyToken = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    // Attache l'utilisateur Better Auth : { id, email, name, firstName, lastName, role, emailVerified, … }
    req.user = session.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized. Invalid session." });
  }
};

/**
 * Bloque les actions sensibles (passage de commande, etc.) si l'email n'est pas vérifié.
 *
 * À utiliser APRÈS `verifyToken`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      message:
        "Veuillez vérifier votre adresse e-mail avant de passer une commande. Consultez votre boîte mail.",
    });
  }
  next();
};

/**
 * Bloque toute requête dont l'utilisateur n'a pas le rôle "seller".
 *
 * À utiliser APRÈS `verifyToken`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const isSeller = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res
      .status(403)
      .json({ message: "Accès refusé. Rôle vendeur requis." });
  }
  next();
};

/**
 * Bloque toute requête dont l'utilisateur n'a pas le rôle "buyer".
 *
 * À utiliser APRÈS `verifyToken`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const isBuyer = (req, res, next) => {
  if (req.user.role !== "buyer") {
    return res
      .status(403)
      .json({ message: "Accès refusé. Rôle acheteur requis." });
  }
  next();
};

/**
 * Bloque toute requête dont l'utilisateur n'a pas le rôle "admin".
 *
 * Réservé pour usage futur — aucune route admin n'est implémentée à ce jour.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Accès refusé. Rôle administrateur requis." });
  }
  next();
};
