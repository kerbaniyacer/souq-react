import { create } from 'zustand';
import type { Cart, CartItem } from '@shared/types';
import { cartApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';

interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number, ownerId?: number | null) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCartPanel: () => void;
  resetCart: () => void;

  // Computed
  itemsCount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  fetchCart: async () => {
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) {
      set({ cart: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await cartApi.get();
      set({ cart: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (variantId, quantity = 1, ownerId) => {
    const { user } = useAuthStore.getState();
    if (user && ownerId && String(user.id) === String(ownerId)) {
      throw new Error('لا يمكنك إضافة منتجك إلى السلة');
    }

    await cartApi.add(variantId, quantity);
    await get().fetchCart();
  },

  updateItem: async (itemId, quantity) => {
    await cartApi.update(itemId, quantity);
    await get().fetchCart();
  },

  removeItem: async (itemId) => {
    await cartApi.remove(itemId);
    await get().fetchCart();
  },

  clearCart: async () => {
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) {
      set({ cart: null });
      return;
    }

    await cartApi.clear();
    set({ cart: null });
  },

  toggleCartPanel: () => set((state) => ({ isOpen: !state.isOpen })),

  resetCart: () => set({ cart: null, isOpen: false }),

  itemsCount: () => {
    const cart = get().cart;
    return cart?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) ?? 0;
  },

  total: () => {
    const cart = get().cart;
    return cart?.total ?? 0;
  },
}));
