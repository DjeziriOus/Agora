import rateLimit from 'express-rate-limit';

export const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limite chaque IP à 3 requêtes par fenêtre
  message: { error: "Trop de tentatives, veuillez réessayer plus tard." }
});