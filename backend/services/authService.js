/**
 * @file Petit service utilitaire profil utilisateur.
 *
 * NE PAS confondre avec un vrai "service d'auth" — toute l'authentification
 * (signup, signin, sessions) est gérée par Better Auth dans
 * {@link module:auth}. Ce fichier ne fait que deux choses : lire un profil
 * et demander à Better Auth de renvoyer un email de vérification.
 *
 * Voir aussi : docs/modules/backend/services-authService.md
 */

import User from '../models/User.js';
import { auth } from "../auth.js";

/**
 * Charge le profil d'un utilisateur depuis Mongoose. Throw 404 si introuvable.
 *
 * @param {string} userId - Identifiant Better Auth.
 * @returns {Promise<import('mongoose').Document>} Document Mongoose du user.
 * @throws {Error} avec `statusCode: 404` si le user n'existe pas.
 */
const getProfile = async (userId) => {
  console.log("calling Get Profile with id : ", userId);
  // .select('-password') est un reliquat de l'ancienne auth maison — sans effet
  // ici car le modèle User n'a pas de champ password (géré par Better Auth).
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Demande à Better Auth de renvoyer un email de vérification.
 *
 * Refuse si le user est déjà vérifié (400) ou introuvable (404).
 *
 * @param {string} userId - Identifiant Better Auth.
 * @returns {Promise<void>}
 * @throws {Error} avec `statusCode: 400` ou `404` selon le cas.
 */
const resendVerificationEmail = async (userId) => {
  const user = await User.findById(userId).select("email emailVerified");
  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }
  if (user.emailVerified) {
    const error = new Error("Email déjà vérifié.");
    error.statusCode = 400;
    throw error;
  }

  await auth.api.sendVerificationEmail({
    body: { email: user.email, callbackURL: "/email-verified" },
  });
};

export { resendVerificationEmail, getProfile };
