import api from '@/shared/services/api';

export interface Notification {
  id: number;
  user: number;
  type: string;
  title: string;
  message: string;
  related_id: string;
  related_type: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  getNotifications: () => api.get<Notification[]>('/notifications/'),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_as_read/'),
  getUnreadCount: () => api.get<{ unread_count: number }>('/notifications/unread_count/'),
};

export const followApi = {
  toggleFollow: (userId: number) => api.post<{ status: string; is_following: boolean }>(`/follows/toggle/${userId}/`),
  getFollows: () => api.get('/follows/'),
};
