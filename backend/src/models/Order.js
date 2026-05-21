import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: { type: String },       // frontend numeric id (as string)
        name: { type: String },
        size: { type: String },
        sku: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        image: { type: String },
        color: { type: String, default: 'Default' },
      },
    ],
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,   // flexible — accepts any address object
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    gst: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod'],
      default: 'cod',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    orderNote: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
