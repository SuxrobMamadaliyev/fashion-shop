// Wraps async route handlers so thrown errors are forwarded to Express's error middleware
module.exports = function catchAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};

