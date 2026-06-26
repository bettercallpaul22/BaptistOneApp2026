import { http } from '@/services/api/http';
import type {
  NotificationListFilterCategory,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notificationList';

const FILTER_RESOURCE_TYPE_MAP: Record<NotificationListFilterCategory, string | null> = {
  all: null,
  unread: null,
  user: 'user',
  church: 'church',
  member: 'member',
  transaction: 'transaction',
  forum: 'forum',
  wallet: 'wallet',
  pastor: 'pastor',
};

function buildNotificationQuery(
  page: number,
  limit: number,
  filter: NotificationListFilterCategory,
): string {
  const unreadOnly = filter === 'unread';
  const resourceType = FILTER_RESOURCE_TYPE_MAP[filter];
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('unreadOnly', String(unreadOnly));
  if (resourceType) params.set('resourceType', resourceType);
  return `/private/notifications?${params.toString()}`;
}

export const notificationService = {
  getNotifications: async (page: number, limit: number, filter: NotificationListFilterCategory) => {
    const url = buildNotificationQuery(page, limit, filter);
    const response = await http.get<NotificationListResponse>(url);

    if (!response.status || !response.data || !Array.isArray(response.data.items)) {
      throw new Error(response.message || 'Unable to load notifications.');
    }

    return response;
  },

  getUnreadCount: async () => {
    const response = await http.get<UnreadCountResponse>('/private/notifications/unread-count');

    if (!response.status) {
      throw new Error(response.message || 'Unable to load unread count.');
    }

    return response;
  },

  markAsRead: async (notificationId: string) => {
    const response = await http.patch<{ status: boolean; message: string }>(
      `/private/notifications/${encodeURIComponent(notificationId)}/read`,
      { read: true },
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to mark notification as read.');
    }

    return response;
  },

  markAllAsRead: async () => {
    const response = await http.patch<{ status: boolean; message: string }>(
      '/private/notifications/read-all',
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to mark all notifications as read.');
    }

    return response;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await http.patch<{ status: boolean; message: string }>(
      `/private/notifications/${encodeURIComponent(notificationId)}/read`,
      { read: true },
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to delete notification.');
    }

    return response;
  },
};
