const bot = require('../instance');

function fmtPrice(n) {
  return Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
}

const statusLabel = {
  NEW: '🆕 Yangi',
  CONFIRMED: '✅ Tasdiqlangan',
  PROCESSING: '⚙️ Jarayonda',
  SHIPPING: '🚚 Yetkazilmoqda',
  DELIVERED: '📦 Yetkazildi',
  CANCELLED: '❌ Bekor qilindi',
};

// Sends a new-order alert to the admin with inline action buttons.
async function notifyAdminNewOrder(order) {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId) return;

  const { orderActionsKeyboard } = require('../keyboards/adminMenu');

  const productLines = order.products
    .map((p) => `• ${p.name} x${p.quantity}${p.size ? ` (${p.size})` : ''} — ${fmtPrice(p.price * p.quantity)}`)
    .join('\n');

  const text =
    `🛍 <b>YANGI BUYURTMA</b>\n\n` +
    `Buyurtma: <b>#${order.orderNumber}</b>\n\n` +
    `👤 Mijoz: ${order.customer.name}\n` +
    `📞 Tel: ${order.customer.phone}\n` +
    `📍 Manzil: ${order.address.region}, ${order.address.district}, ${order.address.addressLine}\n` +
    (order.address.comment ? `💬 Izoh: ${order.address.comment}\n` : '') +
    `\n<b>Mahsulotlar:</b>\n${productLines}\n\n` +
    `Yetkazish: ${fmtPrice(order.deliveryFee)}\n` +
    `<b>Jami: ${fmtPrice(order.total)}</b>\n\n` +
    `To'lov: ${order.paymentMethod}\n` +
    `Manba: ${order.source === 'bot' ? 'Telegram Bot' : 'Mini App'}`;

  await bot.telegram.sendMessage(adminId, text, {
    parse_mode: 'HTML',
    ...orderActionsKeyboard(order._id.toString(), order.status),
  });
}

// Notifies the customer when the admin changes their order status.
async function notifyOrderStatusChanged(order) {
  const text =
    `📦 Buyurtma holati yangilandi\n\n` +
    `Buyurtma: #${order.orderNumber}\n` +
    `Holat: ${statusLabel[order.status] || order.status}`;

  try {
    await bot.telegram.sendMessage(order.telegramUserId, text);
  } catch (e) {
    console.error('[notifyOrderStatusChanged] could not message user:', e.message);
  }
}

module.exports = { notifyAdminNewOrder, notifyOrderStatusChanged, fmtPrice, statusLabel };

