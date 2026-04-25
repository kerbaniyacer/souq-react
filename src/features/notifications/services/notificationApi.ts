import api from '@/shared/services/api';
import type { NotificationType } from '../config/notifications.config';

export interface Notification {
  id: number;
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: number | string;
  meta?: Record<string, any>;
  is_read: boolean;
  is_pinned: boolean;
  created_at: string;
}

export const notificationApi = {
  getNotifications: () => api.get<Notification[]>('/notifications/'),
  markAsRead: (id: number) => api.post('/notifications/mark_as_read/', { id }),
  markAllAsRead: () => api.post('/notifications/mark_all_as_read/'),
  getUnreadCount: () => api.get<{ unread_count: number }>('/notifications/unread_count/'),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}/`),
  pinNotification: (id: number, is_pinned: boolean) => api.post('/notifications/pin/', { id, is_pinned }),
};

export const followApi = {
  toggleFollow: (userId: number) => api.post<{ status: string; is_following: boolean }>(`/follows/toggle/${userId}/`),
  getFollows: () => api.get('/follows/'),
};
