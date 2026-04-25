import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store } from '@shared/types';
import { storesApi } from '@shared/services/api';

interface StoreState {
  stores: Store[];
  activeStoreId: number | null;
  isLoading: boolean;
  loadStores: () => Promise<void>;
  setActiveStore: (id: number) => void;
  createStore: (data: { name: string; description?: string; category?: string }) => Promise<Store>;
  updateStore: (id: number, data: Partial<Store>) => Promise<void>;
  deleteStore: (id: number) => Promise<void>;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stores: [],
      activeStoreId: null,
      isLoading: false,

      loadStores: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const { data } = await storesApi.list();
          const { activeStoreId } = get();
          set({
            stores: data,
            isLoading: false,
            activeStoreId:
              activeStoreId && data.some(s => s.id === activeStoreId)
                ? activeStoreId
                : data[0]?.id ?? null,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      setActiveStore: (id) => set({ activeStoreId: id }),

      createStore: async (data) => {
        const { data: store } = await storesApi.create(data);
        set((state) => ({
          stores: [...state.stores, store],
          activeStoreId: state.activeStoreId ?? store.id,
        }));
        return store;
      },

      updateStore: async (id, data) => {
        await storesApi.update(id, data as Partial<{ name: string; description: string; category: string }>);
        set((state) => ({
          stores: state.stores.map(s => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      deleteStore: async (id) => {
        await storesApi.delete(id);
        set((state) => {
          const newStores = state.stores.filter(s => s.id !== id);
          return {
            stores: newStores,
            activeStoreId: state.activeStoreId === id 
              ? (newStores.length > 0 ? newStores[0].id : null) 
              : state.activeStoreId
          };
        });
      },
    }),
    {
      name: 'store-storage',
      partialize: (state) => ({ activeStoreId: state.activeStoreId }),
    }
  )
);

/** Selector — compute active store without storing it in state */
export const selectActiveStore = (state: StoreState): Store | null =>
  state.stores.find(s => s.id === state.activeStoreId) ?? state.stores[0] ?? null;
