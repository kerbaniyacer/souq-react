import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import { useNotificationStore } from '../store/useNotificationStore';
import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/stores/toastStore';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { setNotifications, setUnreadCount, markRead, markAllRead } = useNotificationStore();
  const { info } = useToast();
  const lastUnreadCount = useRef<number | null>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.getNotifications();
      return res.data;
    },
    refetchInterval: 5000, // Reduced to 5 seconds for real-time feel
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
      
      // If count increased and it's not the first load
      if (lastUnreadCount.current !== null && currentCount > lastUnreadCount.current) {
        const diff = currentCount - lastUnreadCount.current;
        info(`لديك ${diff} إشعار جديد`);
        
        // Invalidate notifications list to get the new content immediately
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      
      setUnreadCount(currentCount);
      lastUnreadCount.current = currentCount;
    }
  }, [unreadData, setUnreadCount, info, queryClient]);

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: (_, id) => {
      markRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    }
  });

  return {
    notifications: useNotificationStore((state) => state.notifications),
    unreadCount: useNotificationStore((state) => state.unreadCount),
    isLoading,
    markAsRead: readMutation.mutate,
    markAllAsRead: readAllMutation.mutate
  };
};
