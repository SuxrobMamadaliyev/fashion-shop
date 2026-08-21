const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { fmtPrice, statusLabel } = require('../services/notify');

function isAdmin(ctx) {
  return String(ctx.from.id) === String(process.env.ADMIN_TELEGRAM_ID);
}

async function handleAdminPanel(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('⛔️ Sizda ruxsat yo\'q.');
  const webAppUrl = process.env.WEBAPP_URL;
  await ctx.reply(
    `🛠 <b>Admin panel</b>\n\n` +
      `/orders — so'nggi buyurtmalar\n` +
      `/products — mahsulotlar soni\n` +
      `/stats — statistika\n` +
      `/users — foydalanuvchilar\n\n` +
      `Admin dashboard: ${webAppUrl}/admin/`,
    { parse_mode: 'HTML' }
  );
}

async function handleAdminOrders(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('⛔️ Sizda ruxsat yo\'q.');
  const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
  if (orders.length === 0) return ctx.reply('Buyurtmalar yo\'q.');

  for (const o of orders) {
    await ctx.reply(
      `#${o.orderNumber} — ${statusLabel[o.status] || o.status}\n` +
        `${o.customer.name} | ${o.customer.phone}\n` +
        `${fmtPrice(o.total)}`
    );
  }
}

async function handleAdminProducts(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('⛔️ Sizda ruxsat yo\'q.');
  const total = await Product.countDocuments();
  const published = await Product.countDocuments({ status: 'published' });
  const lowStock = await Product.countDocuments({ stock: { $lte: 5 } });
  await ctx.reply(`📦 Jami mahsulot: ${total}\n✅ Faol: ${published}\n⚠️ Kam qolgan (≤5): ${lowStock}`);
}

async function handleAdminStats(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('⛔️ Sizda ruxsat yo\'q.');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalAgg, todayAgg, ordersCount, usersCount] = await Promise.all([
    Order.aggregate([{ $match: { status: { $ne: 'CANCELLED' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    User.countDocuments(),
  ]);

  await ctx.reply(
    `📊 <b>Statistika</b>\n\n` +
      `Umumiy savdo: ${fmtPrice(totalAgg[0]?.total || 0)}\n` +
      `Bugungi savdo: ${fmtPrice(todayAgg[0]?.total || 0)}\n` +
      `Buyurtmalar: ${ordersCount}\n` +
      `Foydalanuvchilar: ${usersCount}`,
    { parse_mode: 'HTML' }
  );
}

async function handleAdminUsers(ctx) {
  if (!isAdmin(ctx)) return ctx.reply('⛔️ Sizda ruxsat yo\'q.');
  const total = await User.countDocuments();
  const blocked = await User.countDocuments({ isBlocked: true });
  await ctx.reply(`👥 Jami foydalanuvchilar: ${total}\n🚫 Bloklangan: ${blocked}`);
}

// Inline button callback: order_status:<orderId>:<newStatus>
async function handleOrderStatusCallback(ctx) {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Ruxsat yo\'q');

  const [, orderId, newStatus] = ctx.match;
  const order = await Order.findById(orderId);
  if (!order) return ctx.answerCbQuery('Buyurtma topilmadi');

  const wasDelivered = order.status === 'DELIVERED';
  order.status = newStatus;
  await order.save();

  if (newStatus === 'DELIVERED' && !wasDelivered) {
    await User.findByIdAndUpdate(order.user, { $inc: { totalSpent: order.total, completedOrdersCount: 1 } });
  }

  await ctx.answerCbQuery(`Holat: ${statusLabel[newStatus]}`);
  await ctx.editMessageText(
    `${ctx.callbackQuery.message.text}\n\n➡️ Yangi holat: ${statusLabel[newStatus]}`,
    { parse_mode: 'HTML' }
  ).catch(() => {});

  try {
    await ctx.telegram.sendMessage(
      order.telegramUserId,
      `📦 Buyurtma #${order.orderNumber} holati yangilandi: ${statusLabel[newStatus]}`
    );
  } catch (e) {
    console.error('[handleOrderStatusCallback] notify user failed:', e.message);
  }
}

module.exports = {
  handleAdminPanel,
  handleAdminOrders,
  handleAdminProducts,
  handleAdminStats,
  handleAdminUsers,
  handleOrderStatusCallback,
  isAdmin,
};

