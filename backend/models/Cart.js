import mongoose from 'mongoose';

// Each entry in the cart represents one product, an optional variant, and its quantity.
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Optional product variant identifier, used for size/color combinations.
    variantId: {
      type: String,
      default: null,
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
  { _id: false }
);

// A cart belongs to one user and contains a list of cart items.
// Valid Cart document example:
// {
//   userId: 'user_123',
//   items: [
//     {
//       productId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
//       variantId: 'size-m-black',
//       selected: true,
//       addedAt: new Date(),
//       quantity: 2,
//     },
//   ],
// }
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
  }
);

export default mongoose.model('Cart', cartSchema);
