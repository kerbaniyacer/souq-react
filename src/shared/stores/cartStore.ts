import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart } from '@shared/types';
import { cartApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';

interface CartStore {
  cart: Cart | null;
  guestInfo: {
    full_name: string;
    phone: string;
    email: string;
    address: string;
    wilaya: string;
    baladia: string;
  } | null;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number, ownerId?: number | null, variantData?: any) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCartPanel: () => void;
  resetCart: () => void;
  syncCart: () => Promise<void>;

  // Computed
  itemsCount: () => number;
  total: () => number;
  setGuestInfo: (info: any) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      guestInfo: null,
      isLoading: false,
      isOpen: false,

      fetchCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        set({ isLoading: true });
        try {
          const res = await cartApi.get();
          set({ cart: res.data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (variantId, quantity = 1, ownerId, variantData) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (isAuthenticated && user && ownerId && String(user.id) === String(ownerId)) {
          throw new Error('لا يمكنك إضافة منتجك إلى السلة');
        }

        if (!isAuthenticated) {
          // Guest logic: local update
          const currentCart = get().cart || { items: [], total: 0 } as unknown as Cart;
          const existingItemIndex = currentCart.items.findIndex(item => 
            (item.variant?.id === variantId) || (item.variant_id === variantId)
          );

          let newItems = [...currentCart.items];
          if (existingItemIndex > -1) {
            newItems[existingItemIndex].quantity += quantity;
          } else {
            // Minimal mock item for UI
            newItems.push({
              id: Math.random(), // Temp ID
              variant_id: variantId,
              variant: variantData, // This data comes from the component calling addItem
              quantity: quantity,
              price: variantData?.price || 0,
              subtotal: (variantData?.price || 0) * quantity
            } as any);
          }

          const newTotal = newItems.reduce((sum, item) => sum + ((item.price ?? item.subtotal / item.quantity) * item.quantity), 0);
          set({ cart: { ...currentCart, items: newItems, total: newTotal } });
          return;
        }

        // Authenticated logic
        await cartApi.add(variantId, quantity);
        await get().fetchCart();
      },

      updateItem: async (itemId, quantity) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          const currentCart = get().cart;
          if (!currentCart) return;
          const newItems = currentCart.items.map(item => 
            item.id === itemId ? { ...item, quantity, subtotal: (item.price ?? 0) * quantity } : item
          );
          const newTotal = newItems.reduce((sum, item) => sum + ((item.price ?? item.subtotal / item.quantity) * item.quantity), 0);
          set({ cart: { ...currentCart, items: newItems, total: newTotal } });
          return;
        }

        await cartApi.update(itemId, quantity);
        await get().fetchCart();
      },

      removeItem: async (itemId) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          const currentCart = get().cart;
          if (!currentCart) return;
          const newItems = currentCart.items.filter(item => item.id !== itemId);
          const newTotal = newItems.reduce((sum, item) => sum + ((item.price ?? item.subtotal / item.quantity) * item.quantity), 0);
          set({ cart: { ...currentCart, items: newItems, total: newTotal } });
          return;
        }

        await cartApi.remove(itemId);
        await get().fetchCart();
      },

      clearCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await cartApi.clear();
        }
        set({ cart: null });
      },

      toggleCartPanel: () => set((state) => ({ isOpen: !state.isOpen })),

      resetCart: () => set({ cart: null, isOpen: false }),

      syncCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        const localCart = get().cart;
        if (localCart && localCart.items.length > 0) {
          // Sync local items to server
          for (const item of localCart.items) {
            try {
              // We use variant_id or variant.id
              const vId = item.variant?.id || item.variant_id;
              if (vId) await cartApi.add(vId, item.quantity);
            } catch (e) {
              console.error('Failed to sync item:', item);
            }
          }
        }
        await get().fetchCart();
      },

      itemsCount: () => {
        const cart = get().cart;
        return cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0;
      },

      total: () => {
        const cart = get().cart;
        return cart?.total ?? 0;
      },

      setGuestInfo: (info) => set({ guestInfo: info }),
    }),
    {
      name: 'souq-cart-storage',
      partialize: (state) => ({ 
        cart: state.cart,
        guestInfo: state.guestInfo 
      }),
    }
  )
);
