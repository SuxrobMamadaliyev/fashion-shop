const { Markup } = require('telegraf');

function orderActionsKeyboard(orderId, currentStatus) {
  const buttons = [];
  const flow = {
    NEW: [['✅ Tasdiqlash', 'CONFIRMED'], ['❌ Bekor qilish', 'CANCELLED']],
    CONFIRMED: [['⚙️ Jarayonda', 'PROCESSING'], ['❌ Bekor qilish', 'CANCELLED']],
    PROCESSING: [['🚚 Yetkazilmoqda', 'SHIPPING'], ['❌ Bekor qilish', 'CANCELLED']],
    SHIPPING: [['📦 Yetkazildi', 'DELIVERED']],
  };

  const options = flow[currentStatus] || [];
  for (const [label, status] of options) {
    buttons.push([Markup.button.callback(label, `order_status:${orderId}:${status}`)]);
  }
  return Markup.inlineKeyboard(buttons);
}

module.exports = { orderActionsKeyboard };

