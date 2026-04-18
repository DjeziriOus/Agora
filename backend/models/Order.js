import mongoose from 'mongoose';

const subOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: true }
);

const subOrderSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopName: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'],
      default: 'en_attente',
    },
    total: { type: Number, required: true },
    items: [subOrderItemSchema],
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['en_attente', 'en_preparation', 'en_livraison', 'livree', 'annulee'],
      default: 'en_attente',
    },
    totalPrice: { type: Number, required: true },
    shippingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'France' },
      phone: String,
    },
    subOrders: [subOrderSchema],
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'subOrders.sellerId': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
