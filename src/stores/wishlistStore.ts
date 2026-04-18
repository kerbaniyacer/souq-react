import { create } from 'zustand';
import axios from 'axios';

const DB = '/db';

interface WishlistEntry {
  id: string;
  user_id: string;
  product_id: string;
  product?: any;
  items?: { id: string; variant: any }[];
}

interface WishlistStore {
  items: WishlistEntry[];
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  addItem: (productId: string | number) => Promise<void>;
  removeItem: (productId: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const userId = localStorage.getItem('mock_user_id');
      if (!userId) {
        set({ items: [], isLoading: false });
        return;
      }

      const [wlRes, prodRes] = await Promise.all([
        axios.get(`${DB}/wishlists`),
        axios.get(`${DB}/products`),
      ]);

      // Client-side filter to avoid JSON Server type mismatch
      const wishlists: WishlistEntry[] = (wlRes.data as WishlistEntry[]).filter(
        (w) => String(w.user_id) === String(userId)
      );
      const products: any[] = prodRes.data;

      const itemsWithProducts = wishlists.map((w) => {
        const product = products.find((p) => String(p.id) === String(w.product_id));
        const mainVariant =
          product?.variants?.find((v: any) => v.is_main) ?? product?.variants?.[0];
        return {
          ...w,
          product,
          // expose items[] so Wishlist.tsx can access variant
          items: mainVariant
            ? [{ id: `wi-${w.id}`, variant: mainVariant }]
            : [],
        };
      });

      set({ items: itemsWithProducts, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId) => {
    const userId = localStorage.getItem('mock_user_id');
    if (!userId) return;

    // Prevent duplicates
    if (get().isInWishlist(productId)) return;

    try {
      await axios.post(`${DB}/wishlists`, {
        user_id: userId,
        product_id: String(productId),
      });
      await get().fetchWishlist();
    } catch {
      throw new Error('تعذّر الإضافة');
    }
  },

  removeItem: async (productId) => {
    const userId = localStorage.getItem('mock_user_id');
    if (!userId) return;

    const entry = get().items.find(
      (w) => String(w.product_id) === String(productId)
    );
    if (!entry) return;

    try {
      await axios.delete(`${DB}/wishlists/${entry.id}`);
      set((state) => ({
        items: state.items.filter((w) => w.id !== entry.id),
      }));
    } catch {
      throw new Error('تعذّر الإزالة');
    }
  },

  isInWishlist: (productId) =>
    get().items.some((w) => String(w.product_id) === String(productId)),
}));
