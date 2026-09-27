import { deleteData, getData, sendData, wrapPageResponse } from './httpHelpers';
import type { AppNotification, NotificationType } from '@/types';
import { asEnumValue, asString } from './typed';

function normalizeNotification(n: Record<string, unknown>): AppNotification {
  return {
    id: String(n.id ?? ''),
    userId: String(n.userId ?? ''),
    title: String(n.title ?? ''),
    message: String(n.message ?? ''),
    type: asEnumValue<NotificationType>(n.type ?? 'SYSTEM', ['EMERGENCY', 'BLOOD_REQUEST', 'DONATION_REQUEST', 'APPOINTMENT', 'DONATION_ACCEPTED', 'SYSTEM'], 'SYSTEM') ?? 'SYSTEM',
    read: Boolean(n.read ?? n.isRead),
    createdAt: asString(n.createdAt) ?? '',
  };
}

export const notificationApi = {
  list: async (params?: Record<string, unknown>) => {
    const raw = await getData<unknown>('/api/notifications', params);
    const paged = wrapPageResponse<Record<string, unknown>>(raw);
    return {
      ...paged,
      content: paged.content.map(normalizeNotification),
    };
  },
  unread: async () => {
    const res = await getData<unknown>('/api/notifications/unread');
    if (Array.isArray(res)) return res.map((item) => normalizeNotification(item as Record<string, unknown>));
    if (res && typeof res === 'object' && Array.isArray((res as { notifications?: unknown[] }).notifications)) {
      return (res as { notifications: unknown[] }).notifications.map((item) => normalizeNotification(item as Record<string, unknown>));
    }
    return [];
  },
  markRead: (id: string) => sendData<AppNotification>('patch', `/api/notifications/${id}/read`),
  markAllRead: () => sendData<void>('patch', '/api/notifications/read-all'),
  remove: (id: string) => deleteData(`/api/notifications/${id}`),
};
