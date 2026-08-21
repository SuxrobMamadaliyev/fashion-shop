const crypto = require('crypto');
const User = require('../models/User');

/**
 * Validates Telegram WebApp initData according to the official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC_SHA256(<bot_token>, "WebAppData")
 * check_hash = HEX(HMAC_SHA256(data_check_string, secret_key))
 */
function verifyTelegramInitData(initData, botToken) {
  if (!initData || typeof initData !== 'string') return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const dataCheckArr = [];
  for (const [key, value] of params.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  // Optional: reject stale auth (older than 24h)
  const authDate = Number(params.get('auth_date') || 0);
  const now = Math.floor(Date.now() / 1000);
  if (authDate && now - authDate > 60 * 60 * 24) {
    return null;
  }

  const userRaw = params.get('user');
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    return null;
  }

  return { user, authDate };
}

/**
 * Express middleware: expects header "x-telegram-init-data" with the raw initData string
 * sent from Telegram.WebApp.initData. Validates it, upserts the user, attaches req.telegramUser
 * and req.dbUser (the persisted Mongoose document).
 */
async function requireTelegramAuth(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);

    if (!result || !result.user || !result.user.id) {
      return res.status(401).json({ success: false, message: 'Invalid Telegram authentication' });
    }

    const tgUser = result.user;
    const telegramId = String(tgUser.id);

    let dbUser = await User.findOne({ telegramId });

    if (!dbUser) {
      dbUser = await User.create({
        telegramId,
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        username: tgUser.username || '',
        photoUrl: tgUser.photo_url || '',
        languageCode: tgUser.language_code || 'uz',
        role: telegramId === String(process.env.ADMIN_TELEGRAM_ID) ? 'admin' : 'user',
      });
    } else {
      dbUser.firstName = tgUser.first_name || dbUser.firstName;
      dbUser.lastName = tgUser.last_name || dbUser.lastName;
      dbUser.username = tgUser.username || dbUser.username;
      dbUser.photoUrl = tgUser.photo_url || dbUser.photoUrl;
      if (telegramId === String(process.env.ADMIN_TELEGRAM_ID)) dbUser.role = 'admin';
      await dbUser.save();
    }

    if (dbUser.isBlocked) {
      return res.status(403).json({ success: false, message: 'This account has been blocked' });
    }

    req.telegramUser = tgUser;
    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error('[telegramAuth] error:', err.message);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

module.exports = { requireTelegramAuth, verifyTelegramInitData };

