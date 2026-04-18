import { create } from 'zustand';
import type { Wishlist } from '@/types';
import { wishlistApi } from '@/services/api';

interface WishlistStore {
  items: Wishlist[];
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await wishlistApi.get();
      set({ items: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId) => {
    await wishlistApi.add(productId);
    await get().fetchWishlist();
  },

  removeItem: async (productId) => {
    await wishlistApi.remove(productId);
    await get().fetchWishlist();
  },

  isInWishlist: (productId) => {
    return get().items.some((w) => w.product?.id === productId);
  },
}));
