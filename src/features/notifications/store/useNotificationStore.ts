import { create } from 'zustand';
import { Notification } from '../services/notificationApi';

const sortNotifications = (list: Notification[]) =>
  [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  deleteNotification: (id: number) => void;
  pinNotification: (id: number, isPinned: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({ notifications: sortNotifications(notifications) }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  deleteNotification: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.is_read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),

  pinNotification: (id, isPinned) =>
    set((state) => ({
      notifications: sortNotifications(
        state.notifications.map((n) =>
          n.id === id ? { ...n, is_pinned: isPinned } : n
        )
      ),
    })),
}));
