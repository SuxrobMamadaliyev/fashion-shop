const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    brandName: { type: String, default: 'AURA' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    description: { type: String, default: 'Premium fashion brand' },
    phone: { type: String, default: '' },
    telegram: { type: String, default: '' },
    instagram: { type: String, default: '' },
    accentColor: { type: String, default: '#0A84FF' },
    defaultTheme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    deliveryPrice: { type: Number, default: 25000 },
    minOrderAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'UZS' },
    mandatoryChannels: [
      {
        chatId: { type: String, required: true },
        username: { type: String, default: '' },
        title: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
