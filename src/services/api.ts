import axios from 'axios';
import { sendMerchantOrderEmail, sendNewsletterConfirmationEmail } from './emailService';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- JSON Server (mock backend) ----
const db = axios.create({ baseURL: '/db' });

// ---- Auth ----
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  register: (data: object) =>
    api.post('/auth/register/', data),
  getProfile: () =>
    api.get('/auth/profile/'),
  updateProfile: (data: FormData | object) =>
    api.patch('/auth/profile/', data),
  changePassword: (data: object) =>
    api.post('/auth/change-password/', data),

  // ── التسجيل الاجتماعي ──
  googleAuth: (accessToken: string) =>
    api.post('/auth/social/google/', { access_token: accessToken }),
  facebookAuth: (accessToken: string) =>
    api.post('/auth/social/facebook/', { access_token: accessToken }),
};

// ---- Products (JSON Server) ----
export const productsApi = {
  list: async (params?: Record<string, string | number>) => {
    const res = await db.get('/products');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[] = res.data;

    if (params?.search) {
      const s = String(params.search).toLowerCase();
      products = products.filter((p) => p.name?.toLowerCase().includes(s));
    }
    if (params?.category) {
      products = products.filter((p) => p.category?.slug === params.category);
    }
    if (params?.brand) {
      products = products.filter((p) => p.brand?.slug === params.brand);
    }
    if (params?.is_featured) {
      products = products.filter((p) => p.is_featured === true);
    }

    if (params?.ordering) {
      const ord = String(params.ordering);
      const desc = ord.startsWith('-');
      const key = desc ? ord.slice(1) : ord;
      products.sort((a, b) => {
        const va = key === 'price'
          ? (a.variants?.[0]?.price ?? 0)
          : (a[key] ?? 0);
        const vb = key === 'price'
          ? (b.variants?.[0]?.price ?? 0)
          : (b[key] ?? 0);
        if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
        return desc ? vb - va : va - vb;
      });
    }

    const total = products.length;
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.page_size) || 12;
    const start = (page - 1) * pageSize;
    const paged = products.slice(start, start + pageSize);

    return { data: { results: paged, count: total } };
  },

  detail: async (slug: string) => {
    const res = await db.get(`/products?slug=${slug}`);
    const products = res.data;
    if (!products.length) throw new Error('Product not found');
    return { data: products[0] };
  },

  create: async (data: FormData) => {
    const obj = Object.fromEntries(data.entries());
    const res = await db.post('/products', obj);
    return { data: res.data };
  },

  update: async (id: number, data: FormData) => {
    const obj = Object.fromEntries(data.entries());
    const res = await db.patch(`/products/${id}`, obj);
    return { data: res.data };
  },

  delete: async (id: number) => {
    return db.delete(`/products/${id}`);
  },

  featured: async () => {
    const res = await db.get('/products?is_featured=true');
    return { data: res.data };
  },

  myProducts: async () => {
    const userId = localStorage.getItem('mock_user_id');
    if (!userId) return { data: [] };
    const res = await db.get(`/products?seller_id=${userId}`);
    return { data: res.data };
  },
};

// ---- Categories (JSON Server) ----
export const categoriesApi = {
  list: async () => {
    const res = await db.get('/categories');
    return { data: res.data };
  },
  detail: async (slug: string) => {
    const res = await db.get(`/categories?slug=${slug}`);
    const cats = res.data;
    if (!cats.length) throw new Error('Category not found');
    return { data: cats[0] };
  },
};

// ---- Brands (JSON Server) ----
export const brandsApi = {
  list: async () => {
    const res = await db.get('/brands');
    return { data: res.data };
  },
  detail: async (slug: string) => {
    const res = await db.get(`/brands?slug=${slug}`);
    const brands = res.data;
    if (!brands.length) throw new Error('Brand not found');
    return { data: brands[0] };
  },
};

// ---- Cart ---- (kept for backward compat, cartStore no longer uses it)
export const cartApi = {
  get: () => db.get('/carts'),
  add: () => Promise.resolve({ data: null }),
  update: () => Promise.resolve({ data: null }),
  remove: () => Promise.resolve({ data: null }),
  clear: () => Promise.resolve({ data: null }),
};

// ---- Orders (JSON Server) ----
export const ordersApi = {
  list: async () => {
    const userId = localStorage.getItem('mock_user_id');
    const res = await db.get('/orders');
    const orders = userId
      ? (res.data as any[]).filter((o) => String(o.user_id) === String(userId))
      : res.data;
    return { data: orders };
  },

  detail: async (id: number | string) => {
    const res = await db.get(`/orders/${id}`);
    return { data: res.data };
  },

  create: async (data: object) => {
    const userId = localStorage.getItem('mock_user_id');

    // Read cart from Zustand persist storage
    let cartItems: any[] = [];
    try {
      const raw = localStorage.getItem('cart-storage');
      cartItems = raw ? JSON.parse(raw).state?.cart?.items ?? [] : [];
    } catch { /* ignore */ }

    const subtotal = cartItems.reduce((s: number, i: any) => s + (i.subtotal ?? 0), 0);
    const shipping = subtotal > 5000 ? 0 : 500;
    const total_amount = subtotal + shipping;
    const order_number = `ORD-${Date.now().toString().slice(-8)}`;

    const items = cartItems.map((item: any, idx: number) => ({
      id: `${Date.now()}-${idx}`,
      product_id: item.product_id ?? null,
      seller_id: item.seller_id ?? null,
      product_name: item.variant?.name ?? 'منتج',
      product_price: item.variant?.price ?? 0,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const order = {
      ...data,
      user_id: userId,
      order_number,
      status: 'pending',
      subtotal,
      shipping_cost: shipping,
      discount: 0,
      total_amount,
      payment_status: 'pending',
      tracking_number: '',
      stock_deducted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
    };

    const res = await db.post('/orders', order);

    // إرسال بريد إشعار الطلب الجديد للتاجر (محاكاة)
    try {
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        const sellerId = firstItem.variant?.seller_id ?? firstItem.seller_id;
        if (sellerId) {
          const sellerRes = await db.get(`/users/${sellerId}`);
          if (sellerRes.data?.email) {
            sendMerchantOrderEmail(sellerRes.data.email, order_number, items, total_amount).catch(() => {});
          }
        }
      }
    } catch { /* تجاهل */ }

    return { data: res.data };
  },

  cancel: async (id: number | string) => {
    const res = await db.patch(`/orders/${id}`, { status: 'cancelled' });
    return { data: res.data };
  },

  track: async (orderNumber: string) => {
    const res = await db.get('/orders');
    const order = (res.data as any[]).find((o) => o.order_number === orderNumber);
    if (!order) throw new Error('الطلب غير موجود');
    return { data: order };
  },

  merchantList: async () => {
    const res = await db.get('/orders');
    return { data: res.data };
  },

  merchantDetail: async (id: number | string) => {
    return ordersApi.detail(id);
  },

  updateStatus: async (id: number | string, status: string) => {
    const res = await db.patch(`/orders/${id}`, { status, updated_at: new Date().toISOString() });
    return { data: res.data };
  },
};

// ---- Wishlist ---- (kept for backward compat, wishlistStore handles directly)
export const wishlistApi = {
  get: () => db.get('/wishlists'),
  add: () => Promise.resolve({ data: null }),
  remove: () => Promise.resolve({ data: null }),
};

// ---- Reviews (JSON Server) ----
export const reviewsApi = {
  list: async (productId: number | string) => {
    if (!productId) return { data: [] };
    const res = await db.get('/reviews');
    const reviews = (res.data as any[]).filter(
      (r) => String(r.product) === String(productId) || String(r.product_id) === String(productId)
    );
    return { data: reviews };
  },
  create: async (productId: number | string, data: object) => {
    const userId = localStorage.getItem('mock_user_id');
    const res = await db.post('/reviews', {
      ...data,
      product: String(productId),
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    return { data: res.data };
  },
};

// ---- Newsletter (JSON Server) ----
export const newsletterApi = {
  subscribe: async (email: string) => {
    const res = await db.post('/subscript_emails', {
      email,
      subscribed_at: new Date().toISOString(),
    });
    // إرسال بريد تأكيد الاشتراك
    sendNewsletterConfirmationEmail(email).catch(() => {});
    return { data: res.data };
  },
};
