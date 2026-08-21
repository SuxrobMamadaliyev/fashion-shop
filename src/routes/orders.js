const express = require('express');
const router = express.Router();
const { requireTelegramAuth } = require('../middleware/telegramAuth');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');

router.use(requireTelegramAuth);
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;

