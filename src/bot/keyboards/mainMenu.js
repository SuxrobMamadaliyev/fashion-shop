const { Markup } = require('telegraf');

function mainMenuKeyboard(webAppUrl) {
  return Markup.keyboard([
    [Markup.button.webApp('🛍 Do\'konni ochish', webAppUrl)],
    ['📦 Katalog', '🆕 Yangi kolleksiya'],
    ['🔥 Ko\'p sotilganlar', '🛒 Savatcham'],
    ['📋 Buyurtmalarim', '👤 Profil'],
    ['☎️ Yordam'],
  ]).resize();
}

function inlineOpenShop(webAppUrl, path = '') {
  return {
    inline_keyboard: [[{ text: '🛍 Do\'konda ko\'rish', web_app: { url: webAppUrl + path } }]],
  };
}

module.exports = { mainMenuKeyboard, inlineOpenShop };

