const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { generateOrderNumber } = require('../utils/generateOrderId');
const { isValidPhone, isNonEmptyString } = require('../utils/validators');
const catchAsync = require('../utils/catchAsync');
const { notifyAdminNewOrder } = require('../bot/services/notify');

// Shared logic used both by the REST API (webapp) and the Telegram bot conversation flow.
async function createOrderFromCart({ dbUser, telegramId, customer, address, deliveryMethod, paymentMethod, source }) {
  if (!isNonEmptyString(customer?.name)) throw Object.assign(new Error('Name is required'), { statusCode: 400 });
  if (!isValidPhone(customer?.phone)) throw Object.assign(new Error('Valid phone is required'), { statusCode: 400 });
  if (!isNonEmptyString(address?.region)) throw Object.assign(new Error('Region is required'), { statusCode: 400 });
  if (!isNonEmptyString(address?.district)) throw Object.assign(new Error('District is required'), { statusCode: 400 });
  if (!isNonEmptyString(address?.addressLine)) throw Object.assign(new Error('Address is required'), { statusCode: 400 });

  const cart = await Cart.findOne({ user: dbUser._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });
  }

  // Verify stock and lock in prices/snapshots
  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || product.status !== 'published') {
      throw Object.assign(new Error(`Product no longer available: ${item.product?.name || item.product}`), { statusCode: 400 });
    }
    if (product.stock < item.quantity) {
      throw Object.assign(new Error(`Not enough stock for ${product.name}`), { statusCode: 400 });
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
    subtotal += product.price * item.quantity;
  }

  const settings = (await Settings.findOne({ key: 'main' })) || { deliveryPrice: 25000 };
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : settings.deliveryPrice;
  const total = subtotal + deliveryFee;

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: dbUser._id,
    telegramUserId: telegramId,
    products: orderItems,
    customer,
    address,
    deliveryMethod: deliveryMethod || 'courier',
    paymentMethod: paymentMethod || 'cash',
    subtotal,
    deliveryFee,
    total,
    status: 'NEW',
    source: source || 'webapp',
  });

  // Decrement stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, soldCount: item.quantity },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Update user aggregate stats
  dbUser.ordersCount += 1;
  dbUser.phone = customer.phone || dbUser.phone;
  dbUser.region = address.region || dbUser.region;
  dbUser.district = address.district || dbUser.district;
  dbUser.address = address.addressLine || dbUser.address;
  await dbUser.save();

  // Fire-and-forget admin notification (does not block the response)
  notifyAdminNewOrder(order).catch((e) => console.error('[notifyAdminNewOrder]', e.message));

  return order;
}

// POST /api/orders — { customer, address, deliveryMethod, paymentMethod }
exports.createOrder = catchAsync(async (req, res) => {
  const { customer, address, deliveryMethod, paymentMethod } = req.body;
  const order = await createOrderFromCart({
    dbUser: req.dbUser,
    telegramId: req.dbUser.telegramId,
    customer,
    address,
    deliveryMethod,
    paymentMethod,
    source: 'webapp',
  });
  res.status(201).json({ success: true, order });
});

// GET /api/orders — current user's orders
exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.dbUser._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// GET /api/orders/:id
exports.getOrderById = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.dbUser._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
});

module.exports.createOrderFromCart = createOrderFromCart;

