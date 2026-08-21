function isValidPhone(phone) {
  return typeof phone === 'string' && /^\+?[0-9]{9,15}$/.test(phone.replace(/[\s\-()]/g, ''));
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

module.exports = { isValidPhone, isNonEmptyString };

