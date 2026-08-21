const express = require('express');
const router = express.Router();
const { requireTelegramAuth } = require('../middleware/telegramAuth');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');

router.use(requireTelegramAuth);
router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:productId', removeFavorite);

module.exports = router;

