require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const connectDB = require('./config/db');
const bot = require('./bot/bot');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const favoriteRoutes = require('./routes/favorites');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const webhookRoutes = require('./routes/webhook');

const app = express();

// --- Security middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for Telegram WebApp + Cloudinary images; tighten per-deployment if needed
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssClean());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Static frontend ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// --- Telegram webhook endpoint ---
const webhookPath = `/telegram/webhook/${process.env.BOT_TOKEN || 'no-token'}`;
app.use(webhookPath, webhookRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SPA-style fallback for the admin panel and mini app pages that use client-side routing
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });

  if (process.env.USE_WEBHOOK === 'true' && process.env.BASE_URL) {
    const fullWebhookUrl = `${process.env.BASE_URL}${webhookPath}`;
    await bot.telegram.setWebhook(fullWebhookUrl);
    console.log(`[Bot] Webhook set to ${fullWebhookUrl}`);
  } else {
    await bot.telegram.deleteWebhook().catch(() => {});
    bot.launch();
    console.log('[Bot] Launched in long-polling mode');
  }

  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
