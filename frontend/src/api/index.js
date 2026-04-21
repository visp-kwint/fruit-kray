import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
};

export const categoriesAPI = {
  getAll:     ()     => api.get('/categories'),
  getAdminAll:()     => api.get('/categories'),
  create:     (data) => api.post('/categories', data),
  remove:     (id)   => api.delete(`/categories/${id}`),
};

export const productsAPI = {
  getAll:    (params = {}) => api.get('/products', { params }),
  getById:   (id)          => api.get(`/products/${id}`),
  getAdModal:(productId)   =>
    api.get('/products/admodal/by-product', { params: { productId } }),
};

export const uploadAPI = {
  image: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const ordersAPI = {
  create:      (data) => api.post('/orders', data),
  getAll:      ()     => api.get('/orders'),
  getFrequent: ()     => api.get('/orders/frequent'),
};

export const userAPI = {
  getProfile:    ()     => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getFrequent:   ()     => api.get('/orders/frequent'),
};

export const reviewsAPI = {
  create:      (data) => api.post('/reviews', data),
  getMy:       ()     => api.get('/reviews/my'),
  getByProduct:(id)   => api.get(`/reviews/product/${id}`),
};

export const deliveryReviewsAPI = {
  create: (data) => api.post('/delivery-reviews', data),
  getAll: ()     => api.get('/delivery-reviews'),
};

export const adminAPI = {
  createProduct:  (data)     => api.post('/admin/products', data),
  updateProduct:  (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct:  (id)       => api.delete(`/admin/products/${id}`),

  getAdModals:  ()           => api.get('/admin/admodals'),
  createAdModal:(data)       => api.post('/admin/admodals', data),
  deleteAdModal:(id)         => api.delete(`/admin/admodals/${id}`),
};

export default api;