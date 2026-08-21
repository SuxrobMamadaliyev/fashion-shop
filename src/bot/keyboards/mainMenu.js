const { Markup } = require('telegraf');

// Telegram faqat https:// bilan boshlanadigan manzillarni web_app sifatida qabul qiladi.
// WEBAPP_URL .env'da yo'q yoki noto'g'ri bo'lsa, shu tekshiruv botni qulashdan saqlaydi.
function isValidWebAppUrl(url) {
  return typeof url === 'string' && /^https:\/\//i.test(url);
}

function mainMenuKeyboard(webAppUrl) {
  const firstRow = isValidWebAppUrl(webAppUrl)
    ? [Markup.button.webApp('🛍 Do\'konni ochish', webAppUrl)]
    : ['📦 Katalog']; // WEBAPP_URL sozlanmagan bo'lsa, oddiy tugma bilan almashtiriladi

  return Markup.keyboard([
    firstRow,
    ['📦 Katalog', '🆕 Yangi kolleksiya'],
    ['🔥 Ko\'p sotilganlar', '🛒 Savatcham'],
    ['📋 Buyurtmalarim', '👤 Profil'],
    ['☎️ Yordam'],
  ]).resize();
}

function inlineOpenShop(webAppUrl, path = '') {
  if (!isValidWebAppUrl(webAppUrl)) {
    // Fallback: web_app o'rniga oddiy link tugmasi (https bo'lmasa Telegram buni ham rad etadi,
    // shuning uchun bu holatda tugmani umuman qo'shmaymiz)
    return { inline_keyboard: [] };
  }
  return {
    inline_keyboard: [[{ text: '🛍 Do\'konda ko\'rish', web_app: { url: webAppUrl + path } }]],
  };
}

module.exports.isValidWebAppUrl = isValidWebAppUrl;

module.exports = { mainMenuKeyboard, inlineOpenShop };

