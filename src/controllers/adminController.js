const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const catchAsync = require('../utils/catchAsync');
const { notifyOrderStatusChanged } = require('../bot/services/notify');

// ---------- Dashboard ----------

// GET /api/admin/stats
exports.getStats = catchAsync(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalSalesAgg, todaySalesAgg, ordersCount, usersCount, productsCount, lowStockCount, revenueByDay] =
    await Promise.all([
      Order.aggregate([{ $match: { status: { $ne: 'CANCELLED' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  res.json({
    success: true,
    stats: {
      totalSales: totalSalesAgg[0]?.total || 0,
      todaySales: todaySalesAgg[0]?.total || 0,
      ordersCount,
      usersCount,
      productsCount,
      lowStockCount,
      revenueByDay,
    },
  });
});

// ---------- Products ----------

// GET /api/admin/products
exports.getAllProducts = catchAsync(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).populate('category', 'name slug');
  res.json({ success: true, products });
});

// POST /api/admin/products
exports.createProduct = catchAsync(async (req, res) => {
  const images = (req.files || []).map((f) => f.path);
  const body = { ...req.body, images };

  if (typeof body.sizes === 'string') body.sizes = body.sizes.split(',').map((s) => s.trim()).filter(Boolean);
  if (typeof body.colors === 'string') body.colors = body.colors.split(',').map((s) => s.trim()).filter(Boolean);
  ['isNew', 'isBestSeller', 'isSale'].forEach((f) => {
    if (body[f] !== undefined) body[f] = body[f] === 'true' || body[f] === true;
  });

  const product = await Product.create(body);
  res.status(201).json({ success: true, product });
});

// PUT /api/admin/products/:id
exports.updateProduct = catchAsync(async (req, res) => {
  const body = { ...req.body };
  if (req.files && req.files.length > 0) {
    body.images = req.files.map((f) => f.path);
  }
  if (typeof body.sizes === 'string') body.sizes = body.sizes.split(',').map((s) => s.trim()).filter(Boolean);
  if (typeof body.colors === 'string') body.colors = body.colors.split(',').map((s) => s.trim()).filter(Boolean);
  ['isNew', 'isBestSeller', 'isSale'].forEach((f) => {
    if (body[f] !== undefined) body[f] = body[f] === 'true' || body[f] === true;
  });

  const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// DELETE /api/admin/products/:id
exports.deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true });
});

// PUT /api/admin/products/:id/toggle-status — publish/hide
exports.toggleProductStatus = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  product.status = product.status === 'published' ? 'hidden' : 'published';
  await product.save();
  res.json({ success: true, product });
});

// ---------- Categories ----------

exports.createCategory = catchAsync(async (req, res) => {
  const image = req.file ? req.file.path : '';
  const slug = req.body.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const category = await Category.create({ ...req.body, slug, image });
  res.status(201).json({ success: true, category });
});

exports.updateCategory = catchAsync(async (req, res) => {
  const body = { ...req.body };
  if (req.file) body.image = req.file.path;
  const category = await Category.findByIdAndUpdate(req.params.id, body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ---------- Orders ----------

// GET /api/admin/orders?status=
exports.getAllOrders = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'firstName lastName username telegramId');
  res.json({ success: true, orders });
});

exports.getOrderDetail = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName username telegramId phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
});

// PUT /api/admin/orders/:id — { status }
exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const wasDelivered = order.status === 'DELIVERED';
  order.status = status;
  await order.save();

  if (status === 'DELIVERED' && !wasDelivered) {
    await User.findByIdAndUpdate(order.user, {
      $inc: { totalSpent: order.total, completedOrdersCount: 1 },
    });
  }

  notifyOrderStatusChanged(order).catch((e) => console.error('[notifyOrderStatusChanged]', e.message));

  res.json({ success: true, order });
});

// ---------- Users ----------

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});

exports.toggleBlockUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, user });
});

// ---------- Settings ----------

exports.getSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) settings = await Settings.create({ key: 'main' });
  res.json({ success: true, settings });
});

exports.updateSettings = catchAsync(async (req, res) => {
  const body = { ...req.body };
  if (req.files?.logo?.[0]) body.logo = req.files.logo[0].path;
  if (req.files?.favicon?.[0]) body.favicon = req.files.favicon[0].path;

  const settings = await Settings.findOneAndUpdate({ key: 'main' }, body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  res.json({ success: true, settings });
});

// POST /api/admin/settings/channels — add mandatory subscription channel { chatId, username, title }
exports.addMandatoryChannel = catchAsync(async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: 'main' },
    { $push: { mandatoryChannels: req.body } },
    { new: true, upsert: true }
  );
  res.json({ success: true, settings });
});

// DELETE /api/admin/settings/channels/:chatId
exports.removeMandatoryChannel = catchAsync(async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: 'main' },
    { $pull: { mandatoryChannels: { chatId: req.params.chatId } } },
    { new: true }
  );
  res.json({ success: true, settings });
});

