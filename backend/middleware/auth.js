import { auth } from '../auth.js';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * verifyToken — validates the BetterAuth session from request headers or cookies.
 * Attaches the session user to req.user on success.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    req.user = session.user; // { id, email, name, firstName, lastName, role, emailVerified, … }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized. Invalid session.' });
  }
};

/**
 * requireVerifiedEmail — blocks unverified users from sensitive actions (e.g. placing orders).
 * Must be used AFTER verifyToken.
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
 * isSeller — restricts a route to users with the 'seller' role.
 * Must be used AFTER verifyToken.
 */
export const isSeller = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Accès refusé. Rôle vendeur requis.' });
  }
  next();
};

/**
 * isBuyer — restricts a route to users with the 'buyer' role.
 * Must be used AFTER verifyToken.
 */
export const isBuyer = (req, res, next) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Accès refusé. Rôle acheteur requis.' });
  }
  next();
};

/**
 * isAdmin — restricts a route to users with the 'admin' role.
 * Must be used AFTER verifyToken.
 */
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
};
