const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const catchAsync = require('../utils/catchAsync');

// POST /api/auth/telegram — validated by requireTelegramAuth middleware upstream.
// By the time we reach this handler, req.dbUser already exists (created or updated).
exports.telegramAuth = catchAsync(async (req, res) => {
  const user = req.dbUser;
  res.json({
    success: true,
    user: {
      id: user._id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      role: user.role,
      phone: user.phone,
      region: user.region,
      district: user.district,
      address: user.address,
      totalSpent: user.totalSpent,
      ordersCount: user.ordersCount,
      completedOrdersCount: user.completedOrdersCount,
    },
  });
});

// POST /api/auth/admin/login — { username, password } -> JWT for the admin dashboard.
// The single admin account is bootstrapped from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
exports.adminLogin = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const validUsername = username === process.env.ADMIN_USERNAME;
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  let validPassword = false;
  if (envPasswordHash) {
    validPassword = await bcrypt.compare(password, envPasswordHash);
  } else {
    // Fallback: plain compare against ADMIN_PASSWORD (set ADMIN_PASSWORD_HASH in production instead)
    validPassword = password === process.env.ADMIN_PASSWORD;
  }

  if (!validUsername || !validPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { role: 'admin', username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, token });
});
