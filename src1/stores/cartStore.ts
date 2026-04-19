import { create } from 'zustand';
import type { Cart, CartItem } from '@types';
import { cartApi } from '@services/api';

interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCartPanel: () => void;

  // Computed
  itemsCount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartApi.get();
      set({ cart: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (variantId, quantity = 1) => {
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
    await cartApi.clear();
    set({ cart: null });
  },

  toggleCartPanel: () => set((state) => ({ isOpen: !state.isOpen })),

  itemsCount: () => {
    const cart = get().cart;
    return cart?.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) ?? 0;
  },

  total: () => {
    const cart = get().cart;
    return cart?.total ?? 0;
  },
}));
