import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        itemId: { type: String },          // frontend composite id e.g. "1-3"
        productId: { type: String },       // frontend numeric product id
        name: { type: String },
        size: { type: String },
        sku: { type: String },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
        image: { type: String },
        color: { type: String, default: 'Default' },
      },
    ],
    totalPrice: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
