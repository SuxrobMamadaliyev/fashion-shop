const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { createOrderFromCart } = require('../../controllers/orderController');
const { fmtPrice } = require('../services/notify');
const { Markup } = require('telegraf');

// Simple in-memory step machine per Telegram user for the bot checkout conversation.
// ctx.session is provided by the session middleware registered in bot.js.

async function ensureCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function handleAddToCart(ctx) {
  const productId = ctx.match[1];
  const product = await Product.findById(productId);
  await ctx.answerCbQuery();
  if (!product || product.status !== 'published') {
    return ctx.reply('Mahsulot topilmadi.');
  }
  if (product.stock < 1) {
    return ctx.reply('Kechirasiz, bu mahsulot tugagan.');
  }

  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  const cart = await ensureCart(user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) existing.quantity += 1;
  else cart.items.push({ product: productId, quantity: 1 });
  await cart.save();

  await ctx.reply(`✅ "${product.name}" savatga qo'shildi.`);
}

async function handleBuyNow(ctx) {
  const productId = ctx.match[1];
  const product = await Product.findById(productId);
  await ctx.answerCbQuery();
  if (!product || product.status !== 'published') return ctx.reply('Mahsulot topilmadi.');

  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  const cart = await ensureCart(user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (!existing) cart.items.push({ product: productId, quantity: 1 });
  await cart.save();

  await startCheckout(ctx);
}

async function handleViewCart(ctx) {
  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  const cart = await Cart.findOne({ user: user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return ctx.reply('🛒 Savatchangiz bo\'sh.');
  }

  let text = '🛒 <b>Savatcha</b>\n\n';
  let total = 0;
  cart.items.forEach((item, idx) => {
    const lineTotal = item.product.price * item.quantity;
    total += lineTotal;
    text += `${idx + 1}. ${item.product.name} x${item.quantity} — ${fmtPrice(lineTotal)}\n`;
  });
  text += `\n<b>Jami: ${fmtPrice(total)}</b>`;

  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([[Markup.button.callback('✅ Buyurtma berish', 'checkout_start')]]),
  });
}

async function startCheckout(ctx) {
  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  const cart = await Cart.findOne({ user: user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return ctx.reply('🛒 Savatchangiz bo\'sh. Avval mahsulot tanlang.');
  }

  ctx.session.checkout = { step: 'name', data: {} };
  await ctx.reply('📝 Buyurtma berish uchun ma\'lumotlaringizni kiriting.\n\nIsm-familiyangizni yozing:');
}

async function handleCheckoutStep(ctx) {
  const session = ctx.session.checkout;
  if (!session) return false; // not in checkout flow

  const text = ctx.message?.text?.trim();
  if (!text) return true;

  switch (session.step) {
    case 'name':
      session.data.name = text;
      session.step = 'phone';
      await ctx.reply('📞 Telefon raqamingizni kiriting (masalan: +998901234567):');
      return true;

    case 'phone':
      if (!/^\+?[0-9]{9,15}$/.test(text.replace(/[\s\-()]/g, ''))) {
        await ctx.reply('❗️ Telefon raqami noto\'g\'ri. Qaytadan kiriting (masalan: +998901234567):');
        return true;
      }
      session.data.phone = text;
      session.step = 'region';
      await ctx.reply('📍 Viloyatingizni kiriting:');
      return true;

    case 'region':
      session.data.region = text;
      session.step = 'district';
      await ctx.reply('🏘 Tumaningizni kiriting:');
      return true;

    case 'district':
      session.data.district = text;
      session.step = 'address';
      await ctx.reply('🏠 Aniq manzilingizni kiriting (ko\'cha, uy):');
      return true;

    case 'address':
      session.data.addressLine = text;
      session.step = 'comment';
      await ctx.reply('💬 Izoh qoldirmoqchimisiz? (yo\'q bo\'lsa "-" deb yozing):');
      return true;

    case 'comment': {
      session.data.comment = text === '-' ? '' : text;
      session.step = 'confirm';

      const summary =
        `📋 <b>Buyurtmangizni tekshiring:</b>\n\n` +
        `👤 ${session.data.name}\n` +
        `📞 ${session.data.phone}\n` +
        `📍 ${session.data.region}, ${session.data.district}\n` +
        `🏠 ${session.data.addressLine}\n` +
        (session.data.comment ? `💬 ${session.data.comment}\n` : '') +
        `\nTasdiqlaysizmi?`;

      await ctx.reply(summary, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Tasdiqlash', 'checkout_confirm')],
          [Markup.button.callback('❌ Bekor qilish', 'checkout_cancel')],
        ]),
      });
      return true;
    }

    default:
      return false;
  }
}

async function handleCheckoutConfirm(ctx) {
  const session = ctx.session.checkout;
  await ctx.answerCbQuery();

  if (!session || !session.data) {
    return ctx.reply('Sessiya topilmadi. Iltimos, qaytadan boshlang.');
  }

  const user = await User.findOne({ telegramId: String(ctx.from.id) });

  try {
    const order = await createOrderFromCart({
      dbUser: user,
      telegramId: String(ctx.from.id),
      customer: { name: session.data.name, phone: session.data.phone },
      address: {
        region: session.data.region,
        district: session.data.district,
        addressLine: session.data.addressLine,
        comment: session.data.comment || '',
      },
      deliveryMethod: 'courier',
      paymentMethod: 'cash',
      source: 'bot',
    });

    delete ctx.session.checkout;

    await ctx.reply(
      `🎉 Buyurtmangiz qabul qilindi!\n\n` +
        `Buyurtma raqami: <b>#${order.orderNumber}</b>\n` +
        `Jami: <b>${fmtPrice(order.total)}</b>\n\n` +
        `Tez orada operatorlarimiz siz bilan bog'lanishadi.`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    await ctx.reply(`❗️ Xatolik: ${err.message}`);
  }
}

async function handleCheckoutCancel(ctx) {
  await ctx.answerCbQuery();
  delete ctx.session.checkout;
  await ctx.reply('❌ Buyurtma bekor qilindi.');
}

module.exports = {
  handleAddToCart,
  handleBuyNow,
  handleViewCart,
  startCheckout,
  handleCheckoutStep,
  handleCheckoutConfirm,
  handleCheckoutCancel,
};

