
const express = require('express');
const router = express.Router();
const bot = require('../bot/bot');

// Telegram will POST updates to this endpoint when USE_WEBHOOK=true.
router.post('/', (req, res) => {
  bot.handleUpdate(req.body, res);
});

module.exports = router;
