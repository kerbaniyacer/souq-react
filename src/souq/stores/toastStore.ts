import { useMemo } from 'react';
import { create } from 'zustand';
import type { Toast } from '@souq/types';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, duration: 4000, ...toast };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, newToast.duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper hook — returns a STABLE reference (memoized) so it's safe in useEffect deps
export const useToast = () => {
  const addToast = useToastStore((s) => s.addToast);
  return useMemo(() => ({
    success: (message: string) => addToast({ type: 'success', message }),
    error:   (message: string) => addToast({ type: 'error',   message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info:    (message: string) => addToast({ type: 'info',    message }),
  }), [addToast]);
};
