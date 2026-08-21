const User = require('../../models/User');
const { mainMenuKeyboard, isValidWebAppUrl } = require('../keyboards/mainMenu');
const Settings = require('../../models/Settings');

async function handleStart(ctx) {
  const tgUser = ctx.from;
  const telegramId = String(tgUser.id);

  let user = await User.findOne({ telegramId });
  if (!user) {
    user = await User.create({
      telegramId,
      firstName: tgUser.first_name || '',
      lastName: tgUser.last_name || '',
      username: tgUser.username || '',
      languageCode: tgUser.language_code || 'uz',
      role: telegramId === String(process.env.ADMIN_TELEGRAM_ID) ? 'admin' : 'user',
    });
  }

  const settings = (await Settings.findOne({ key: 'main' })) || { brandName: 'AURA' };
  const webAppUrl = process.env.WEBAPP_URL;

  if (!isValidWebAppUrl(webAppUrl)) {
    console.warn('[Bot] WEBAPP_URL sozlanmagan yoki https:// bilan boshlanmayapti — "Do\'konni ochish" tugmasi vaqtincha ko\'rsatilmaydi.');
  }

  await ctx.reply(
    `👋 Xush kelibsiz, ${tgUser.first_name || 'mehmon'}!\n\n` +
      `<b>${settings.brandName}</b> — premium fashion do'koniga xush kelibsiz.\n\n` +
      `Quyidagi menyudan foydalaning yoki do'konni to'g'ridan-to'g'ri oching 👇`,
    { parse_mode: 'HTML', ...mainMenuKeyboard(webAppUrl) }
  );
}

module.exports = { handleStart };

