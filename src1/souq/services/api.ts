import axios from 'axios';
import { sendMerchantOrderEmail, sendNewsletterConfirmationEmail } from './emailService';

const API_BASE = '/api?XTransformPort=3000';

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
      window.location.hash = '#/login';
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

// ---- Cart ---- (localStorage-based for mock) ----
const CART_STORAGE_KEY = 'souq-cart';

function getLocalCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { id: 1, user: null, session_key: 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), items: [], total: 0, items_count: 0 };
}

function saveLocalCart(cart: any) {
  cart.updated_at = new Date().toISOString();
  const total = (cart.items || []).reduce((s: number, i: any) => s + (i.subtotal ?? 0), 0);
 cart.total = total;
  cart.items_count = (cart.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
 localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  return cart;
}

export const cartApi = {
  get: async () => {
 const cart = getLocalCart();
 return { data: cart };
  },
  add: async (variantId: number, quantity: number) => {
    const cart = getLocalCart();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items: any[] = cart.items || [];

    // Fetch variant info from JSON Server products
    let variantData: any = null;
    let productData: any = null;
    try {
      const productsRes = await db.get('/products');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allProducts: any[] = productsRes.data;
      for (const p of allProducts) {
        const v = (p.variants || []).find((v: any) => v.id === variantId);
        if (v) { variantData = v; productData = p; break; }
      }
    } catch { /* ignore */ }

    if (!variantData) return { data: null };

    const existing = items.find((i: any) => i.variant?.id === variantId);
    if (existing) {
      existing.quantity += quantity;
      existing.subtotal = existing.quantity * (variantData.price ?? 0);
    } else {
      items.push({
        id: Date.now(),
        cart: cart.id,
        variant: variantData,
        product_id: productData?.id,
        seller_id: productData?.seller_id ?? productData?.seller,
        quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtotal: quantity * (variantData.price ?? 0),
      });
    }

    cart.items = items;
 saveLocalCart(cart);
 return { data: cart };
  },
  update: async (itemId: number, quantity: number) => {
    const cart = getLocalCart();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = cart.items || [];
    const item = items.find((i: any) => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = quantity * (item.variant?.price ?? 0);
      item.updated_at = new Date().toISOString();
    }
    cart.items = items;
 saveLocalCart(cart);
 return { data: cart };
  },
  remove: async (itemId: number) => {
    const cart = getLocalCart();
    cart.items = (cart.items || []).filter((i: any) => i.id !== itemId);
    saveLocalCart(cart);
    return { data: cart };
  },
  clear: async () => {
    const cart = getLocalCart();
    cart.items = [];
    saveLocalCart(cart);
    return { data: cart };
  },
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

// ---- Wishlist ---- (localStorage-based for mock) ----
const WISHLIST_STORAGE_KEY = 'souq-wishlist';

function getLocalWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveLocalWishlist(items: any[]) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

export const wishlistApi = {
  get: async () => {
    const items = getLocalWishlist();
    return { data: items };
  },
  add: async (productId: number) => {
    const items = getLocalWishlist();
    // Avoid duplicates
    if (items.some((w: any) => w.product?.id === productId)) {
      return { data: items };
    }
    // Fetch product from JSON Server
    let product: any = null;
    try {
      const res = await db.get(`/products/${productId}`);
      product = res.data;
    } catch {
      // Try by slug or list
      try {
        const res = await db.get('/products');
        product = (res.data as any[]).find((p: any) => p.id === productId);
      } catch { /* ignore */ }
    }
    if (product) {
      items.push({
        id: Date.now(),
        wishlist: 1,
        user: 1,
        product: product,
        items: product.variants ? [{ variant: product.variants[0] || null }] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtotal: product.variants?.[0]?.price ?? 0,
      });
    }
    saveLocalWishlist(items);
    return { data: items };
  },
  remove: async (productId: number) => {
    let items = getLocalWishlist();
    items = items.filter((w: any) => w.product?.id !== productId);
    saveLocalWishlist(items);
    return { data: items };
  },
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
