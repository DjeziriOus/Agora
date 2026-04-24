import User from '../models/User.js';
import { auth } from "../auth.js";




/**
 * Get the profile of the currently authenticated user.
 * @param {string} userId
 * @returns {Object} - user object (without password)
 */
const getProfile = async (userId) => {
  console.log("calling Get Profile with id : ", userId);
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Resend verification email to the user.
 * @param {string} userId
 * @returns {void}
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
