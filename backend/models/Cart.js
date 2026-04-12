import mongoose from "mongoose";

// Each entry in the cart represents one product variant and its quantity.
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Reference to the Variant document — always required.
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    // Whether this item is selected for checkout.
    selected: {
      type: Boolean,
      default: true,
    },
    // When this item was added to the cart.
    addedAt: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

// A cart belongs to one user and contains a list of cart items.
const cartSchema = new mongoose.Schema(
  {
    userId: {
      // Better Auth user IDs are stored as strings in this project.
      type: String,
      required: true,
      unique: true,
    },
    // The cart can contain multiple product entries.
    items: [cartItemSchema],
  },
  {
    // Automatically adds createdAt and updatedAt.
    timestamps: true,
  },
);

export default mongoose.model("Cart", cartSchema);
