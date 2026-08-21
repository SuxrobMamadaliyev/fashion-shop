const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    telegramUserId: { type: String, required: true, index: true },
    products: [OrderItemSchema],
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: {
      region: { type: String, required: true },
      district: { type: String, required: true },
      addressLine: { type: String, required: true },
      comment: { type: String, default: '' },
    },
    deliveryMethod: { type: String, enum: ['courier', 'pickup'], default: 'courier' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'click', 'payme'], default: 'cash' },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
      default: 'NEW',
      index: true,
    },
    source: { type: String, enum: ['webapp', 'bot'], default: 'webapp' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
