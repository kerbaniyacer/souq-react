import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import { useNotificationStore } from '../store/useNotificationStore';
import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/stores/toastStore';

/** Lightweight — only polling + store sync. Call in always-mounted components (NotificationBell). */
export const useNotificationPolling = () => {
  const queryClient = useQueryClient();
  const { setNotifications, setUnreadCount } = useNotificationStore();
  const { info } = useToast();
  const lastUnreadCount = useRef<number | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.getNotifications();
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await notificationApi.getUnreadCount();
      return res.data;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (notifications) setNotifications(notifications);
  }, [notifications, setNotifications]);

  useEffect(() => {
    if (unreadData) {
      const currentCount = unreadData.unread_count;
      if (lastUnreadCount.current !== null && currentCount > lastUnreadCount.current) {
        const diff = currentCount - lastUnreadCount.current;
        info(`لديك ${diff} إشعار جديد`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      setUnreadCount(currentCount);
      lastUnreadCount.current = currentCount;
    }
  }, [unreadData, setUnreadCount, info, queryClient]);
};

/** Full hook with mutations — use only inside NotificationDropdown. */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { markRead, markAllRead, deleteNotification, pinNotification } = useNotificationStore();

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onMutate: (id) => { markRead(id); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: () => { markAllRead(); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onMutate: (id) => { deleteNotification(id); },
    onError: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, is_pinned }: { id: number; is_pinned: boolean }) =>
      notificationApi.pinNotification(id, is_pinned),
    onMutate: ({ id, is_pinned }) => { pinNotification(id, is_pinned); },
    onError: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  return {
    notifications: useNotificationStore((s) => s.notifications),
    unreadCount: useNotificationStore((s) => s.unreadCount),
    markAsRead: readMutation.mutate,
    markAllAsRead: readAllMutation.mutate,
    removeNotification: deleteMutation.mutate,
    togglePin: (id: number, currentPinned: boolean) =>
      pinMutation.mutate({ id, is_pinned: !currentPinned }),
  };
};
