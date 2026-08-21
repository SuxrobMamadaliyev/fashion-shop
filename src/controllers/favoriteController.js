
const Favorite = require('../models/Favorite');
const catchAsync = require('../utils/catchAsync');

// GET /api/favorites
exports.getFavorites = catchAsync(async (req, res) => {
  const favorites = await Favorite.find({ user: req.dbUser._id }).populate('product');
  res.json({ success: true, favorites });
});

// POST /api/favorites — { productId }
exports.addFavorite = catchAsync(async (req, res) => {
  const { productId } = req.body;
  try {
    const favorite = await Favorite.create({ user: req.dbUser._id, product: productId });
    res.status(201).json({ success: true, favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already in favorites' });
    }
    throw err;
  }
});

// DELETE /api/favorites/:productId
exports.removeFavorite = catchAsync(async (req, res) => {
  await Favorite.findOneAndDelete({ user: req.dbUser._id, product: req.params.productId });
  res.json({ success: true });
});
