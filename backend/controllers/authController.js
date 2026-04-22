import * as authService from '../services/authService.js';

/**
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/resend-verification
 */
const resendVerificationEmail = async (req, res) => {
  try {
    await authService.resendVerificationEmail(req.user.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export { getProfile, resendVerificationEmail };
