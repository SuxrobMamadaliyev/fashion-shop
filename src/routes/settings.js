
const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../controllers/productController');

router.get('/', getPublicSettings);

module.exports = router;
