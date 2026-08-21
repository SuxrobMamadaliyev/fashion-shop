// Centralized fetch wrapper. Every authenticated request carries the raw Telegram
// initData string in a header; the backend validates it per Telegram's official algorithm.
const API_BASE = '/api';

function getInitData() {
  return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';
}

async function apiRequest(method, path, body, isFormData = false) {
  const headers = {};
  const initData = getInitData();
  if (initData) headers['x-telegram-init-data'] = initData;

  const opts = { method, headers };

  if (body !== undefined) {
    if (isFormData) {
      opts.body = body; // FormData sets its own content-type boundary
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(API_BASE + path, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Server javobini o\'qib bo\'lmadi');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return data;
}

const api = {
  authTelegram: () => apiRequest('POST', '/auth/telegram'),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest('GET', `/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => apiRequest('GET', `/products/${id}`),
  getCategories: () => apiRequest('GET', '/categories'),

  getCart: () => apiRequest('GET', '/cart'),
  addToCart: (productId, quantity, size, color) =>
    apiRequest('POST', '/cart', { productId, quantity, size, color }),
  updateCartItem: (itemId, quantity) => apiRequest('PUT', `/cart/${itemId}`, { quantity }),
  removeCartItem: (itemId) => apiRequest('DELETE', `/cart/${itemId}`),

  getFavorites: () => apiRequest('GET', '/favorites'),
  addFavorite: (productId) => apiRequest('POST', '/favorites', { productId }),
  removeFavorite: (productId) => apiRequest('DELETE', `/favorites/${productId}`),

  createOrder: (payload) => apiRequest('POST', '/orders', payload),
  getMyOrders: () => apiRequest('GET', '/orders'),
  getOrder: (id) => apiRequest('GET', `/orders/${id}`),

  getPublicSettings: () => apiRequest('GET', '/settings'),
};

