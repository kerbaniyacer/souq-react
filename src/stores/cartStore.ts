import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const DB = '/db';

interface LocalCartItem {
  id: number;
  variant_id: string | number;
  product_id: string | number;
  seller_id: string | number;
  variant: {
    id: string | number;
    name: string;
    sku: string;
    price: number;
    images: { image: string }[];
  };
  quantity: number;
  subtotal: number;
}

interface LocalCart {
  items: LocalCartItem[];
  total: number;
  items_count: number;
}

interface CartStore {
  cart: LocalCart | null;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (variantId: string | number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCartPanel: () => void;

  itemsCount: () => number;
  total: () => number;
}

function calcCart(items: LocalCartItem[]): LocalCart {
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  return { items, total, items_count: items.length };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      isOpen: false,

      fetchCart: async () => {
        if (!get().cart) {
          set({ cart: { items: [], total: 0, items_count: 0 } });
        }
      },

      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true });
        try {
          // Find product/variant from JSON Server
          const res = await axios.get(`${DB}/products`);
          const products: any[] = res.data;
          let foundVariant: any = null;
          let foundProduct: any = null;

          for (const product of products) {
            const variant = (product.variants ?? []).find(
              (v: any) => String(v.id) === String(variantId)
            );
            if (variant) {
              foundVariant = variant;
              foundProduct = product;
              break;
            }
          }

          if (!foundVariant || !foundProduct) {
            throw new Error('المنتج غير موجود');
          }

          const current = get().cart ?? { items: [], total: 0, items_count: 0 };
          const existingIdx = current.items.findIndex(
            (i) => String(i.variant_id) === String(variantId)
          );

          let newItems: LocalCartItem[];
          if (existingIdx >= 0) {
            newItems = current.items.map((item, idx) =>
              idx === existingIdx
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: foundVariant.price * (item.quantity + quantity),
                  }
                : item
            );
          } else {
            const newItem: LocalCartItem = {
              id: Date.now(),
              variant_id: variantId,
              product_id: foundProduct.id,
              seller_id: foundProduct.seller?.id ?? foundProduct.seller_id ?? '',
              variant: {
                id: foundVariant.id,
                name: `${foundProduct.name}${foundVariant.name !== 'الافتراضي' ? ` - ${foundVariant.name}` : ''}`,
                sku: foundVariant.sku ?? '',
                price: foundVariant.price,
                images: foundProduct.main_image ? [{ image: foundProduct.main_image }] : [],
              },
              quantity,
              subtotal: foundVariant.price * quantity,
            };
            newItems = [...current.items, newItem];
          }

          set({ cart: calcCart(newItems), isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      updateItem: async (itemId, quantity) => {
        const current = get().cart;
        if (!current) return;
        const newItems = current.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, subtotal: item.variant.price * quantity }
            : item
        );
        set({ cart: calcCart(newItems) });
      },

      removeItem: async (itemId) => {
        const current = get().cart;
        if (!current) return;
        const newItems = current.items.filter((i) => i.id !== itemId);
        set({ cart: calcCart(newItems) });
      },

      clearCart: async () => {
        set({ cart: { items: [], total: 0, items_count: 0 } });
      },

      toggleCartPanel: () => set((state) => ({ isOpen: !state.isOpen })),

      itemsCount: () =>
        get().cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,

      total: () => get().cart?.total ?? 0,
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
