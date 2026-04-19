import axios from 'axios';
import { sendNewsletterConfirmationEmail } from './emailService';
import djangoApi from './authService';
export { djangoApi };

// Use djangoApi which handles JWT and 401 auto-refresh
const api = djangoApi;
export default api;

// ---- JSON Server (mock backend) ----
const db = axios.create({ baseURL: '/db' });

// ---- Products (Django backend) ----
export const productsApi = {
  list: async (params?: Record<string, string | number>) => {
    const res = await api.get('/products/', { params });
    return { data: res.data };
  },

  detail: async (slug: string) => {
    const res = await api.get(`/products/${slug}/`);
    return { data: res.data };
  },

  create: async (data: object) => {
    const res = await api.post('/merchant/products/', data);
    return { data: res.data };
  },

  update: async (id: number, data: object) => {
    const res = await api.patch(`/merchant/products/${id}/`, data);
    return { data: res.data };
  },

  delete: async (id: number) => {
    return api.delete(`/merchant/products/${id}/`);
  },

  featured: async () => {
    const res = await api.get('/products/', { params: { is_featured: true } });
    return { data: res.data.results ?? res.data };
  },

  myProducts: async () => {
    const res = await api.get('/merchant/products/');
    return { data: res.data.results ?? res.data };
  },

  merchantDetail: async (id: number | string) => {
    const res = await api.get(`/merchant/products/${id}/`);
    return { data: res.data };
  },
};

// ---- Categories (Django backend) ----
export const categoriesApi = {
  list: async () => {
    const res = await api.get('/categories/');
    return { data: res.data };
  },
  detail: async (slug: string) => {
    const res = await api.get(`/categories/${slug}/`);
    return { data: res.data };
  },
};

// ---- Brands (Django backend) ----
export const brandsApi = {
  list: async () => {
    const res = await api.get('/brands/');
    return { data: res.data };
  },
  detail: async (slug: string) => {
    const res = await api.get(`/brands/${slug}/`);
    return { data: res.data };
  },
};

// ---- Cart ---- (Django backend) ----
export const cartApi = {
  get: async () => { const res = await api.get('/cart/'); return { data: res.data }; },
  add: async (variantId: number, quantity: number) => {
    const res = await api.post('/cart/items/', { variant_id: variantId, quantity });
    return { data: res.data };
  },
  update: async (itemId: number, quantity: number) => {
    const res = await api.patch(`/cart/items/${itemId}/`, { quantity });
    return { data: res.data };
  },
  remove: async (itemId: number) => {
    const res = await api.delete(`/cart/items/${itemId}/delete/`);
    return { data: res.data };
  },
  clear: async () => {
    const res = await api.delete('/cart/clear/');
    return { data: res.data };
  },
};

// ---- Orders (Django backend) ----
export const ordersApi = {
  list: async () => { const res = await api.get('/orders/'); return { data: res.data }; },
  detail: async (id: number | string) => { const res = await api.get(`/orders/${id}/`); return { data: res.data }; },
  create: async (data: object) => { const res = await api.post('/orders/create/', data); return { data: res.data }; },
  cancel: async (id: number | string) => { const res = await api.post(`/orders/${id}/cancel/`); return { data: res.data }; },
  track: async (orderNumber: string) => { const res = await api.get(`/orders/track/${orderNumber}/`); return { data: res.data }; },
  merchantList: async () => { const res = await api.get('/merchant/orders/'); return { data: res.data }; },
  merchantDetail: async (id: number | string) => { const res = await api.get(`/orders/${id}/`); return { data: res.data }; },
  updateStatus: async (id: number | string, status: string) => {
    const res = await api.patch(`/merchant/orders/${id}/status/`, { status });
    return { data: res.data };
  },
};

// ---- Wishlist (Django backend) ----
export const wishlistApi = {
  get: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return { data: [] };
    const res = await api.get('/wishlist/');
    return { data: res.data };
  },
  add: async (productId: number) => {
    const res = await api.post('/wishlist/items/', { product_id: productId });
    return { data: res.data };
  },
  remove: async (productId: number) => {
    await api.delete(`/wishlist/items/${productId}/`);
    return { data: null };
  },
};

// ---- Reviews (Django backend) ----
export const reviewsApi = {
  list: async (productId: number | string) => {
    if (!productId) return { data: [] };
    const res = await api.get('/reviews/', { params: { product: productId } });
    return { data: res.data };
  },
  create: async (productId: number | string, data: object) => {
    const res = await api.post('/reviews/create/', { ...data, product: Number(productId) });
    return { data: res.data };
  },
  delete: async (reviewId: number) => {
    await api.delete(`/reviews/${reviewId}/delete/`);
    return { data: null };
  },
};

// ---- Newsletter (JSON Server — مؤقت) ----
export const newsletterApi = {
  subscribe: async (email: string) => {
    const res = await db.post('/subscript_emails', { email, subscribed_at: new Date().toISOString() });
    sendNewsletterConfirmationEmail(email).catch(() => {});
    return { data: res.data };
  },
};
