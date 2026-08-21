const Order = require('../models/Order');

/**
 * Generates a sequential, human-friendly order number like #ORD-10452.
 * Uses the current count of orders + a base offset to avoid collisions.
 */
async function generateOrderNumber() {
  const count = await Order.countDocuments();
  const sequence = 10000 + count + 1;
  const candidate = `ORD-${sequence}`;

  const exists = await Order.findOne({ orderNumber: candidate });
  if (exists) {
    // Extremely rare race condition fallback
    return `ORD-${sequence}-${Date.now().toString().slice(-4)}`;
  }
  return candidate;
}

module.exports = { generateOrderNumber };

