const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    username: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    languageCode: { type: String, default: 'uz' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, default: '' },
    region: { type: String, default: '' },
    district: { type: String, default: '' },
    address: { type: String, default: '' },
    totalSpent: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    completedOrdersCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
