import express from 'express';
import { getProfile, resendVerificationEmail } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { resendLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.get("/me", verifyToken, getProfile);

router.post(
  "/resend-verification",
  resendLimiter,
  verifyToken,
  resendVerificationEmail
);

export default router;
