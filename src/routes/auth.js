const express = require('express');
const router = express.Router();
const { telegramAuth, adminLogin } = require('../controllers/authController');
const { requireTelegramAuth } = require('../middleware/telegramAuth');

router.post('/telegram', requireTelegramAuth, telegramAuth);
router.post('/admin/login', adminLogin);

module.exports = router;

