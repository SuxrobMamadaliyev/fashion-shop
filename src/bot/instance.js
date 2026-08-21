const { Telegraf } = require('telegraf');

if (!process.env.BOT_TOKEN) {
  console.warn('[Bot] BOT_TOKEN is not set — the Telegram bot will not function until it is provided in .env');
}

const bot = new Telegraf(process.env.BOT_TOKEN || 'MISSING_TOKEN');

module.exports = bot;

