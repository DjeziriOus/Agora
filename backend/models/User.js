/**
 * @file Modèle Mongoose miroir de la collection `user` gérée par Better Auth.
 *
 * Ce modèle ne fait JAMAIS d'écriture — toutes les modifications passent par
 * l'API Better Auth (cf. {@link module:auth}). Il sert uniquement pour les
 * `.populate()` Mongoose dans Shop, Product, Order, etc.
 *
 * IMPORTANT : le nom de collection est fixé à `"user"` (singulier) pour
 * matcher la config Better Auth `collectionNames.user`. Sans cette option,
 * Mongoose pluraliserait en `users` et l'auth serait cassée.
 *
 * Voir aussi : docs/modules/backend/models-User.md
 */

import mongoose from "mongoose";

/**
 * @typedef {Object} UserDoc
 * @property {string} _id - UUID Better Auth (string, pas ObjectId).
 * @property {string} email
 * @property {boolean} emailVerified
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} name - Conservé pour compatibilité Better Auth.
 * @property {string} image - URL de la photo de profil.
 * @property {string} imagePublicId - Identifiant Cloudinary de la photo (pour suppression).
 * @property {number|null} age
 * @property {string} gender
 * @property {"unassigned"|"buyer"|"seller"|"admin"} role
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const userSchema = new mongoose.Schema(
  {
    email: { type: String },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    name: { type: String, default: "" }, // kept for BetterAuth compat
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    age: { type: Number, default: null },
    gender: { type: String, default: "" },
    role: {
      type: String,
      enum: ["unassigned", "buyer", "seller", "admin"],
      default: "unassigned",
    },
  },
  {
    timestamps: true,
    collection: "user", // explicit — must match BetterAuth collectionNames
  },
);

export default mongoose.model("User", userSchema);
