const Product = require('../../models/Product');
const Category = require('../../models/Category');
const { Markup } = require('telegraf');
const { fmtPrice } = require('../services/notify');

// Sends a paginated list of category buttons.
async function handleCatalog(ctx) {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 });
  if (categories.length === 0) {
    return ctx.reply('Hozircha kategoriyalar mavjud emas.');
  }
  const buttons = categories.map((c) => [Markup.button.callback(c.name, `cat:${c._id}`)]);
  await ctx.reply('📦 Kategoriyani tanlang:', Markup.inlineKeyboard(buttons));
}

async function handleCategorySelect(ctx) {
  const categoryId = ctx.match[1];
  const products = await Product.find({ category: categoryId, status: 'published' }).limit(10);
  await ctx.answerCbQuery();

  if (products.length === 0) {
    return ctx.reply('Bu kategoriyada mahsulotlar topilmadi.');
  }

  for (const p of products) {
    await sendProductCard(ctx, p);
  }
}

async function sendProductCard(ctx, product) {
  const webAppUrl = `${process.env.WEBAPP_URL}/product.html?id=${product._id}`;
  const caption =
    `<b>${product.name}</b>\n\n` +
    `${product.description ? product.description.slice(0, 200) + '\n\n' : ''}` +
    `💰 ${fmtPrice(product.price)}` +
    (product.oldPrice ? ` <s>${fmtPrice(product.oldPrice)}</s>` : '') +
    (product.discount ? ` (-${product.discount}%)` : '') +
    `\n📏 O'lchamlar: ${product.sizes.join(', ') || '—'}\n` +
    `🎨 Ranglar: ${product.colors.join(', ') || '—'}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🛒 Savatga qo\'shish', callback_data: `add_cart:${product._id}` },
        { text: '⚡ Hoziroq sotib olish', callback_data: `buy_now:${product._id}` },
      ],
      [{ text: '🛍 Do\'konda ochish', web_app: { url: webAppUrl } }],
    ],
  };

  if (product.images && product.images[0]) {
    await ctx.replyWithPhoto(product.images[0], { caption, parse_mode: 'HTML', reply_markup: keyboard });
  } else {
    await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

async function handleBestSellers(ctx) {
  const products = await Product.find({ status: 'published', isBestSeller: true }).limit(10);
  if (products.length === 0) return ctx.reply('Hozircha ko\'p sotilgan mahsulotlar yo\'q.');
  for (const p of products) await sendProductCard(ctx, p);
}

async function handleNewCollection(ctx) {
  const products = await Product.find({ status: 'published', isNew: true }).limit(10);
  if (products.length === 0) return ctx.reply('Hozircha yangi mahsulotlar yo\'q.');
  for (const p of products) await sendProductCard(ctx, p);
}

module.exports = { handleCatalog, handleCategorySelect, handleBestSellers, handleNewCollection, sendProductCard };

