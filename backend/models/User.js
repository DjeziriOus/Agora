import mongoose from 'mongoose';

/**
 * Thin Mongoose User model — mirrors BetterAuth's `users` collection.
 * BetterAuth owns all writes; this model is used only for `.populate()` in
 * Shop / Product / Order refs.
 *
 * IMPORTANT: the collection name is explicitly set to 'users' so it aligns
 * with BetterAuth's collectionNames config (which also uses 'users').
 */
const userSchema = new mongoose.Schema(
  {
    email:         { type: String },
    emailVerified: { type: Boolean, default: false },
    firstName:     { type: String, default: '' },
    lastName:      { type: String, default: '' },
    name:          { type: String, default: '' }, // kept for BetterAuth compat
    photo:         { type: String, default: '' },
    age:           { type: Number, default: null },
    gender:        { type: String, default: '' },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
  },
  {
    timestamps: true,
    collection: 'users', // explicit — must match BetterAuth collectionNames
  }
);

export default mongoose.model('User', userSchema);
