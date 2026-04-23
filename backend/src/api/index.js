import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Авто-добавление токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Авто-разлогин при 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// отзывы
export const deliveryReviewsAPI = {
  create: (data) => api.post('/delivery-reviews', data),
  getAll: ()     => api.get('/delivery-reviews'),
  getMy:  ()     => api.get('/delivery-reviews/my'),
};

// ── Товары ───────────────────────────────────────────────────────
export const productsAPI = {
  getAll:       (params) => api.get('/products', { params }),
  getById:      (id)     => api.get(`/products/${id}`),
  // Категория передаётся в UPPERCASE: FRUITS, VEGETABLES, DESSERTS
  getAdModal:   (category) =>
    api.get('/products/admodal/by-category', { params: { category } }),
};

// ── Авторизация ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
};

// ── Пользователь ────────────────────────────────────────────────
export const userAPI = {
  getProfile:    ()     => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getFrequent:   ()     => api.get('/orders/frequent'),
};

// ── Заказы ──────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: ()     => api.get('/orders'),
};

// ── Админ ────────────────────────────────────────────────────────
export const adminAPI = {
  createProduct:  (data)     => api.post('/admin/products', data),
  updateProduct:  (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct:  (id)       => api.delete(`/admin/products/${id}`),
  getAdModals:    ()         => api.get('/admin/admodals'),
  createAdModal:  (data)     => api.post('/admin/admodals', data),
  updateAdModal:  (id, data) => api.put(`/admin/admodals/${id}`, data),
  deleteAdModal:  (id)       => api.delete(`/admin/admodals/${id}`),
};

export default api;