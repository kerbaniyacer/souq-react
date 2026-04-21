export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (filters: any) => ['products', 'list', filters] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    featured: ['products', 'featured'] as const,
    myProducts: ['products', 'merchant'] as const,
  },
  merchant: {
    stats: ['merchant', 'stats'] as const,
    orders: ['merchant', 'orders'] as const,
    orderDetail: (id: string | number) => ['merchant', 'orders', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    detail: (id: string | number) => ['orders', id] as const,
  },
  cart: ['cart'] as const,
  wishlist: ['wishlist'] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  reviews: (productId: string | number) => ['reviews', productId] as const,
} as const;
