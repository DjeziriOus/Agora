const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new user.
 * @param {Object} data - { name, email, password, role }
 * @returns {Object} - { user, token }
 */
const register = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email already exists.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password, role });

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Login an existing user.
 * @param {Object} data - { email, password }
 * @returns {Object} - { user, token }
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Get the profile of the currently authenticated user.
 * @param {string} userId
 * @returns {Object} - user object (without password)
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

// ── Helper ──────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { register, login, getProfile };
