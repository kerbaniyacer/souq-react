import djangoApi, { fetchPublicProfileDjango } from '@features/auth/services/authService';
export { djangoApi };

export const authApi = {
  publicProfile: async (username: string) => {
    const data = await fetchPublicProfileDjango(username);
    return { data };
  },
};

// Use djangoApi which handles JWT and 401 auto-refresh
const api = djangoApi;
export default api;

// ---- Products (Django backend) ----
export const productsApi = {
  list: async (params?: Record<string, string | number>) => {
    const res = await api.get('/products/', { params });
    // Django might return { results: [...] } or just [...]
    return { data: res.data.results ?? res.data };
  },

  detail: async (slug: string) => {
    // Django uses slugs for public detail
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
    return { data: res.data.results ?? res.data };
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
    return { data: res.data.results ?? res.data };
  },
  detail: async (slug: string) => {
    const res = await api.get(`/brands/${slug}/`);
    return { data: res.data };
  },
};

// ---- Cart ---- (Django backend) ----
export const cartApi = {
  get: async () => { 
    const res = await api.get('/cart/'); 
    return { data: res.data.results ?? res.data }; 
  },
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
  list: async () => { 
    const res = await api.get('/orders/'); 
    return { data: res.data.results ?? res.data }; 
  },
  detail: async (id: number | string) => { const res = await api.get(`/orders/${id}/`); return { data: res.data }; },
  create: async (data: object) => { const res = await api.post('/orders/create/', data); return { data: res.data }; },
  cancel: async (id: number | string) => { const res = await api.post(`/orders/${id}/cancel/`); return { data: res.data }; },
  uploadReceipt: async (id: number | string, formData: FormData) => {
    const res = await api.patch(`/orders/${id}/receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
  },
  track: async (orderNumber: string) => { const res = await api.get(`/orders/track/${orderNumber}/`); return { data: res.data }; },
  merchantList: async (params?: any) => { 
    const res = await api.get('/merchant/orders/', { params }); 
    return { data: res.data.results ?? res.data }; 
  },
  merchantDetail: async (id: number | string) => { const res = await api.get(`/merchant/orders/${id}/`); return { data: res.data }; },
  updateStatus: async (id: number | string, status: string) => {
    const res = await api.patch(`/merchant/orders/${id}/status/`, { status });
    return { data: res.data };
  },
  notifyProofStatus: async (orderId: number | string, status: 'approved' | 'rejected', reason?: string) => {
    const res = await api.post(`/merchant/suborders/${orderId}/notify-proof/`, { status, reason });
    return { data: res.data };
  },
  uploadProof: async (orderId: number | string, formData: FormData) => {
    const res = await api.post(`/orders/${orderId}/proof/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
  },
  approveProof: async (proofId: number) => {
    const res = await api.post(`/merchant/payments/${proofId}/approve/`);
    return { data: res.data };
  },
  rejectProof: async (proofId: number, reason: string) => {
    const res = await api.post(`/merchant/payments/${proofId}/reject/`, { reason });
    return { data: res.data };
  },
  confirmReceipt: async (id: number | string) => {
    const res = await api.post(`/orders/${id}/confirm-receipt/`);
    return { data: res.data };
  },
};

// ---- Wishlist (Django backend) ----
export const wishlistApi = {
  get: async () => {
    const res = await api.get('/wishlist/');
    return { data: res.data.results ?? res.data };
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
    const res = await api.get('/reviews/products/', { params: { product: productId } });
    return { data: res.data.results ?? res.data };
  },
  create: async (productId: number | string, data: any) => {
    // Handle images via FormData if present
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      formData.append('product', String(productId));
      formData.append('rating', String(data.rating));
      formData.append('comment', data.comment || '');
      data.images.forEach((img: File) => {
        formData.append('images', img);
      });
      const res = await api.post('/reviews/products/create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { data: res.data };
    }
    
    const res = await api.post('/reviews/products/create/', { ...data, product: Number(productId) });
    return { data: res.data };
  },
  delete: async (reviewId: number) => {
    await api.delete(`/reviews/products/${reviewId}/delete/`);
    return { data: null };
  },
  // Seller/Merchant Reviews
  rateMerchant: async (subOrderId: number, data: { rating: number; shipping_rating?: number; comment?: string }) => {
    const res = await api.post('/reviews/seller/create/', { 
      sub_order: subOrderId, 
      rating: data.rating, 
      shipping_rating: data.shipping_rating ?? 5,
      comment: data.comment || '' 
    });
    return { data: res.data };
  },
  sellerList: async (sellerId: number | string) => {
    const res = await api.get(`/reviews/seller/${sellerId}/`);
    return { data: res.data.results ?? res.data };
  },
  // Buyer Reviews
  rateBuyer: async (subOrderId: number, data: { rating: number; comment?: string }) => {
    const res = await api.post('/reviews/buyer/create/', { 
      sub_order: subOrderId, 
      rating: data.rating, 
      comment: data.comment || '' 
    });
    return { data: res.data };
  },
  buyerList: async (buyerId: number | string) => {
    const res = await api.get(`/reviews/buyer/${buyerId}/`);
    return { data: res.data.results ?? res.data };
  }
};

// ---- Newsletter (Migrated to Django) ----
export const newsletterApi = {
  subscribe: async (email: string) => {
    const res = await api.post('/newsletter/subscribe/', { email });
    return { data: res.data };
  },
};

// ---- Chat (Django backend) ----
export const chatApi = {
  getConversations: async () => {
    const res = await api.get('/chat/conversations/');
    return { data: res.data.results ?? res.data };
  },
  getOrCreateConversation: async (sellerId: number, productId?: number) => {
    const res = await api.post('/chat/conversations/get-or-create/', { 
      seller_id: sellerId, 
      product_id: productId 
    });
    return { data: res.data };
  },
  getMessages: async (conversationId: number) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages/`);
    return { data: res.data };
  },
  sendMessage: async (conversationId: number, content: string) => {
    const res = await api.post('/chat/messages/', { 
      conversation: conversationId, 
      content 
    });
    return { data: res.data };
  },
  notifyPayment: async (conversationId: number) => {
    const res = await api.post(`/chat/conversations/${conversationId}/notify-payment/`);
    return { data: res.data };
  },
  uploadReceipt: async (conversationId: number, formData: FormData) => {
    const res = await api.post(`/chat/conversations/${conversationId}/upload-receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
  },
  deleteConversation: async (conversationId: number) => {
    const res = await api.delete(`/chat/conversations/${conversationId}/`);
    return { data: res.data };
  },
};

