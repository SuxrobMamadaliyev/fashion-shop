const bot = require('./instance');
const { mainMenuKeyboard } = require('./keyboards/mainMenu');
const { checkSubscription } = require('./middleware/checkSubscription');

const { handleStart } = require('./handlers/start');
const { handleCatalog, handleCategorySelect, handleBestSellers, handleNewCollection } = require('./handlers/catalog');
const {
  handleAddToCart,
  handleBuyNow,
  handleViewCart,
  startCheckout,
  handleCheckoutStep,
  handleCheckoutConfirm,
  handleCheckoutCancel,
} = require('./handlers/order');
const { handleProfile, handleMyOrders, handleSupport } = require('./handlers/profile');
const {
  handleAdminPanel,
  handleAdminOrders,
  handleAdminProducts,
  handleAdminStats,
  handleAdminUsers,
  handleOrderStatusCallback,
} = require('./handlers/admin');

// --- In-memory session middleware ---
// Simple per-chat session store. Good enough for a single-instance Render deployment.
// Each session holds transient checkout conversation state (see handlers/order.js).
const sessions = new Map();
bot.use((ctx, next) => {
  const key = ctx.from?.id ? String(ctx.from.id) : null;
  if (!key) return next();
  if (!sessions.has(key)) sessions.set(key, {});
  ctx.session = sessions.get(key);
  return next();
});

// --- Commands ---
bot.use(checkSubscription);
bot.start(handleStart);
bot.action('check_subscription', async (ctx) => {
  await ctx.answerCbQuery('Tekshirilmoqda...');
  await ctx.deleteMessage().catch(() => {});
  await handleStart(ctx);
});

bot.command('admin', handleAdminPanel);
bot.command('orders', handleAdminOrders);
bot.command('products', handleAdminProducts);
bot.command('stats', handleAdminStats);
bot.command('users', handleAdminUsers);

// --- Reply keyboard text handlers ---
bot.hears('📦 Katalog', handleCatalog);
bot.hears('🆕 Yangi kolleksiya', handleNewCollection);
bot.hears('🔥 Ko\'p sotilganlar', handleBestSellers);
bot.hears('🛒 Savatcham', handleViewCart);
bot.hears('📋 Buyurtmalarim', handleMyOrders);
bot.hears('👤 Profil', handleProfile);
bot.hears('☎️ Yordam', handleSupport);

// --- Inline callback queries ---
bot.action(/^cat:(.+)$/, handleCategorySelect);
bot.action(/^add_cart:(.+)$/, handleAddToCart);
bot.action(/^buy_now:(.+)$/, handleBuyNow);
bot.action('checkout_start', startCheckout);
bot.action('checkout_confirm', handleCheckoutConfirm);
bot.action('checkout_cancel', handleCheckoutCancel);
bot.action(/^order_status:(.+):(.+)$/, handleOrderStatusCallback);

// --- Free text: routes into the checkout conversation if active ---
bot.on('text', async (ctx, next) => {
  const handled = await handleCheckoutStep(ctx);
  if (!handled) return next();
});

bot.catch((err, ctx) => {
  console.error(`[Bot error] update ${ctx.updateType}:`, err);
});

module.exports = bot;

