const ADMIN_API_BASE = '/api/admin';
const TOKEN_KEY = 'admin_jwt';

const adminApi = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  async login(username, password) {
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Login xato');
    return data;
  },

  async request(method, path, body, isFormData = false) {
    const token = adminApi.getToken();
    if (!token) {
      location.href = 'login.html';
      throw new Error('Not authenticated');
    }
    const headers = { Authorization: `Bearer ${token}` };
    const opts = { method, headers };
    if (body !== undefined) {
      if (isFormData) opts.body = body;
      else { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    }
    const res = await fetch(ADMIN_API_BASE + path, opts);
    if (res.status === 401 || res.status === 403) {
      adminApi.clearToken();
      location.href = 'login.html';
      throw new Error('Sessiya tugagan, qaytadan kiring');
    }
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || 'Xatolik');
    return data;
  },

  getStats: () => adminApi.request('GET', '/stats'),

  getProducts: () => adminApi.request('GET', '/products'),
  createProduct: (fd) => adminApi.request('POST', '/products', fd, true),
  updateProduct: (id, fd) => adminApi.request('PUT', `/products/${id}`, fd, true),
  deleteProduct: (id) => adminApi.request('DELETE', `/products/${id}`),
  toggleProductStatus: (id) => adminApi.request('PUT', `/products/${id}/toggle-status`),

  getCategories: () => fetch('/api/categories').then((r) => r.json()),
  createCategory: (fd) => adminApi.request('POST', '/categories', fd, true),
  deleteCategory: (id) => adminApi.request('DELETE', `/categories/${id}`),

  getOrders: (status) => adminApi.request('GET', `/orders${status ? '?status=' + status : ''}`),
  getOrder: (id) => adminApi.request('GET', `/orders/${id}`),
  updateOrderStatus: (id, status) => adminApi.request('PUT', `/orders/${id}`, { status }),

  getUsers: () => adminApi.request('GET', '/users'),
  toggleBlockUser: (id) => adminApi.request('PUT', `/users/${id}/toggle-block`),

  getSettings: () => adminApi.request('GET', '/settings'),
  updateSettings: (fd) => adminApi.request('PUT', '/settings', fd, true),
  addChannel: (payload) => adminApi.request('POST', '/settings/channels', payload),
  removeChannel: (chatId) => adminApi.request('DELETE', `/settings/channels/${chatId}`),
};
