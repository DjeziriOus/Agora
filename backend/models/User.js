import mongoose from "mongoose";
/**
 * Thin Mongoose User model — mirrors BetterAuth's `user` collection.
 * BetterAuth owns all writes; this model is used only for `.populate()` in
 * Shop / Product / Order refs.
 *
 * IMPORTANT: the collection name is explicitly set to 'user' so it aligns
 * with BetterAuth's collectionNames config (which also uses 'user').
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
