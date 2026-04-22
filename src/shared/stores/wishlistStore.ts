import { create } from 'zustand';
import type { WishlistItem } from '@shared/types';
import { wishlistApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  addItem: (productId: number, ownerId?: number | null) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  resetWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) {
      set({ items: [], isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await wishlistApi.get();
      set({ items: res.data as WishlistItem[], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, ownerId) => {
    const { user } = useAuthStore.getState();
    if (user && ownerId && String(user.id) === String(ownerId)) {
      throw new Error('لا يمكنك إضافة منتجك إلى المفضلة');
    }

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

  resetWishlist: () => set({ items: [], isLoading: false }),
}));
