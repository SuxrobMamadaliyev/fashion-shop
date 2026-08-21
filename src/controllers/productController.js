const Product = require('../models/Product');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');

// GET /api/products?category=&search=&isNew=&isBestSeller=&isSale=&sort=&page=&limit=
exports.getProducts = catchAsync(async (req, res) => {
  const { category, search, isNew, isBestSeller, isSale, sort, page = 1, limit = 20 } = req.query;

  const filter = { status: 'published' };
  if (category) filter.category = category;
  if (isNew === 'true') filter.isNew = true;
  if (isBestSeller === 'true') filter.isBestSeller = true;
  if (isSale === 'true') filter.isSale = true;
  if (search) filter.$text = { $search: search };

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  if (sort === 'price_desc') sortOption = { price: -1 };
  if (sort === 'popular') sortOption = { soldCount: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// GET /api/products/:id
exports.getProductById = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product || product.status !== 'published') {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  product.views += 1;
  await product.save();
  res.json({ success: true, product });
});

// GET /api/categories
exports.getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, categories });
});

// GET /api/settings — public brand settings (safe subset) for the storefront
const Settings = require('../models/Settings');
exports.getPublicSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'main' });
    if (!settings) settings = await Settings.create({ key: 'main' });
    res.json({
      success: true,
      settings: {
        brandName: settings.brandName,
        logo: settings.logo,
        favicon: settings.favicon,
        description: settings.description,
        phone: settings.phone,
        telegram: settings.telegram,
        instagram: settings.instagram,
        accentColor: settings.accentColor,
        defaultTheme: settings.defaultTheme,
        deliveryPrice: settings.deliveryPrice,
        minOrderAmount: settings.minOrderAmount,
        currency: settings.currency,
      },
    });
  } catch (err) {
    next(err);
  }
};

