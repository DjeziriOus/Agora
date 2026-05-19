/**
 * @file Limiteurs de débit (rate limiters) appliqués sur certaines routes sensibles.
 *
 * Voir aussi : docs/modules/backend/middleware-rateLimiter.md
 */

import rateLimit from 'express-rate-limit';

/**
 * Limiteur pour le renvoi d'e-mail de vérification.
 *
 * Limite chaque IP à 3 requêtes par tranche de 5 minutes.
 * Au-delà, renvoie HTTP 429 avec un message en français.
 *
 * Utilisé sur : `POST /api/account/resend-verification`.
 *
 * @type {import('express').RequestHandler}
 */
export const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limite chaque IP à 3 requêtes par fenêtre
  message: { error: "Trop de tentatives, veuillez réessayer plus tard." }
});
