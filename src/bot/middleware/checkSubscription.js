const Settings = require('../../models/Settings');

// Verifies the user is subscribed to all mandatory channels configured in the admin panel.
// If not, replies with an inline keyboard linking to each channel and blocks further handling.
async function checkSubscription(ctx, next) {
  try {
    const settings = await Settings.findOne({ key: 'main' });
    const channels = settings?.mandatoryChannels || [];
    if (channels.length === 0) return next();

    const userId = ctx.from.id;
    const notSubscribed = [];

    for (const ch of channels) {
      try {
        const member = await ctx.telegram.getChatMember(ch.chatId, userId);
        if (['left', 'kicked'].includes(member.status)) {
          notSubscribed.push(ch);
        }
      } catch (e) {
        console.error(`[checkSubscription] could not check ${ch.chatId}:`, e.message);
      }
    }

    if (notSubscribed.length > 0) {
      const keyboard = {
        inline_keyboard: [
          ...notSubscribed
            .map((ch) => [{ text: `📢 ${ch.title || ch.username || 'Kanal'}`, url: ch.username ? `https://t.me/${ch.username.replace('@', '')}` : undefined }])
            .filter((row) => row[0].url),
          [{ text: '✅ Obuna bo\'ldim', callback_data: 'check_subscription' }],
        ],
      };
      await ctx.reply('📢 Botdan foydalanish uchun quyidagi kanallarga obuna bo\'ling:', { reply_markup: keyboard });
      return;
    }

    return next();
  } catch (err) {
    console.error('[checkSubscription] error:', err.message);
    return next();
  }
}

module.exports = { checkSubscription };

