import axios from 'axios';

const TOKEN_KEY = 'iox-admin-token';
const USER_KEY = 'iox-admin-user';

export const session = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get user() {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  },
  set({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => Promise.reject(error.response?.data || { message: error.message || 'Request failed' }),
);

export const adminApi = {
  async login(payload) {
    const data = await api.post('/auth/login', payload);
    return {
      user: data.user,
      token: data.tokens?.accessToken,
    };
  },
  users: () => api.get('/admin/users'),
  pendingOrders: () => api.get('/admin/orders/pending-verification'),
  approveOrder: (id) => api.patch(`/admin/orders/${id}/approve`, {}),
  rejectOrder: (id, reason) => api.patch(`/admin/orders/${id}/reject`, { reason }),
  transactions: () => api.get('/admin/transactions'),
  coupons: () => api.get('/admin/coupons'),
  tokens: () => api.get('/tokens'),
  settings: () => api.get('/admin/settings'),
  saveSettings: (payload) => api.patch('/admin/settings', payload),
  saveToken: (payload) => api.post('/admin/tokens', payload),
  createCoupon: (payload) => api.post('/admin/coupons', payload),
};
