import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem, Product } from '@shared/types';
import { wishlistApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  addItem: (productId: number, ownerId?: number | null, productData?: Product) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  resetWishlist: () => void;
  syncWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchWishlist: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        set({ isLoading: true });
        try {
          const res = await wishlistApi.get();
          set({ items: res.data as WishlistItem[], isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, ownerId, productData) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (isAuthenticated && user && ownerId && String(user.id) === String(ownerId)) {
          throw new Error('لا يمكنك إضافة منتجك إلى المفضلة');
        }

        if (!isAuthenticated) {
          // Guest logic
          if (get().isInWishlist(productId)) return;
          
          const newItem: WishlistItem = {
            id: Math.random(),
            product: productData as Product,
            created_at: new Date().toISOString(),
          };
          set({ items: [...get().items, newItem] });
          return;
        }

        await wishlistApi.add(productId);
        await get().fetchWishlist();
      },

      removeItem: async (productId) => {
        const { isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated) {
          set({ items: get().items.filter(item => item.product?.id !== productId) });
          return;
        }

        await wishlistApi.remove(productId);
        await get().fetchWishlist();
      },

      isInWishlist: (productId) => {
        return get().items.some((w) => (w.product?.id === productId) || (w as any).product_id === productId);
      },

      resetWishlist: () => set({ items: [], isLoading: false }),

      syncWishlist: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        const localItems = get().items;
        if (localItems.length > 0) {
          for (const item of localItems) {
            try {
              if (item.product?.id) await wishlistApi.add(item.product.id);
            } catch (e) {
              console.error('Failed to sync wishlist item:', item);
            }
          }
        }
        await get().fetchWishlist();
      },
    }),
    {
      name: 'souq-wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
