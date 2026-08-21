const User = require('../../models/User');
const Order = require('../../models/Order');
const { fmtPrice, statusLabel } = require('../services/notify');
const { Markup } = require('telegraf');

async function handleProfile(ctx) {
  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  if (!user) return ctx.reply('Iltimos, /start buyrug\'ini bosing.');

  const text =
    `👤 <b>Profil</b>\n\n` +
    `Ism: ${user.firstName} ${user.lastName}\n` +
    (user.username ? `Username: @${user.username}\n` : '') +
    `Telegram ID: ${user.telegramId}\n\n` +
    `📦 Buyurtmalar: ${user.ordersCount}\n` +
    `✅ Yakunlangan: ${user.completedOrdersCount}\n` +
    `💰 Jami xarid: ${fmtPrice(user.totalSpent)}`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}

async function handleMyOrders(ctx) {
  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  if (!user) return ctx.reply('Iltimos, /start buyrug\'ini bosing.');

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
  if (orders.length === 0) return ctx.reply('Sizda hali buyurtmalar yo\'q.');

  for (const o of orders) {
    const text =
      `📋 Buyurtma #${o.orderNumber}\n` +
      `Holat: ${statusLabel[o.status] || o.status}\n` +
      `Jami: ${fmtPrice(o.total)}\n` +
      `Sana: ${o.createdAt.toLocaleDateString('uz-UZ')}`;
    await ctx.reply(text);
  }
}

async function handleSupport(ctx) {
  const phone = process.env.SUPPORT_PHONE || 'Admin bilan bog\'laning';
  await ctx.reply(`☎️ Yordam kerakmi?\n\nBiz bilan bog'laning: ${phone}`);
}

module.exports = { handleProfile, handleMyOrders, handleSupport };

