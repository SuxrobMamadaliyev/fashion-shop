const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const { upload } = require('../config/cloudinary');
const ctrl = require('../controllers/adminController');

router.use(requireAdmin);

router.get('/stats', ctrl.getStats);

router.get('/products', ctrl.getAllProducts);
router.post('/products', upload.array('images', 6), ctrl.createProduct);
router.put('/products/:id', upload.array('images', 6), ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);
router.put('/products/:id/toggle-status', ctrl.toggleProductStatus);

router.post('/categories', upload.single('image'), ctrl.createCategory);
router.put('/categories/:id', upload.single('image'), ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

router.get('/orders', ctrl.getAllOrders);
router.get('/orders/:id', ctrl.getOrderDetail);
router.put('/orders/:id', ctrl.updateOrderStatus);

router.get('/users', ctrl.getAllUsers);
router.put('/users/:id/toggle-block', ctrl.toggleBlockUser);

router.get('/settings', ctrl.getSettings);
router.put(
  '/settings',
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  ctrl.updateSettings
);
router.post('/settings/channels', ctrl.addMandatoryChannel);
router.delete('/settings/channels/:chatId', ctrl.removeMandatoryChannel);

module.exports = router;

