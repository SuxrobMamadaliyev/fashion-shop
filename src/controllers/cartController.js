const Cart = require('../models/Cart');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');

async function populateCart(cart) {
  return cart.populate('items.product', 'name price oldPrice images stock sku status');
}

// GET /api/cart
exports.getCart = catchAsync(async (req, res) => {
  let cart = await Cart.findOne({ user: req.dbUser._id });
  if (!cart) cart = await Cart.create({ user: req.dbUser._id, items: [] });
  await populateCart(cart);
  res.json({ success: true, cart });
});

// POST /api/cart — { productId, quantity, size, color }
exports.addToCart = catchAsync(async (req, res) => {
  const { productId, quantity = 1, size = '', color = '' } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.status !== 'published') {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: 'Not enough stock' });
  }

  let cart = await Cart.findOne({ user: req.dbUser._id });
  if (!cart) cart = await Cart.create({ user: req.dbUser._id, items: [] });

  const existing = cart.items.find(
    (i) => i.product.toString() === productId && i.size === size && i.color === color
  );

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: productId, quantity, size, color });
  }

  await cart.save();
  await populateCart(cart);
  res.status(201).json({ success: true, cart });
});

// PUT /api/cart/:itemId — { quantity }
exports.updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.dbUser._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

// DELETE /api/cart/:itemId
exports.removeCartItem = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.dbUser._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, cart });
});

// DELETE /api/cart — clear entire cart (used after order placed)
exports.clearCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.dbUser._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ success: true, cart });
});

