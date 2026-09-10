import { deleteData, getData, sendData } from './httpHelpers';
import type { NotificationApi } from './contracts';

export const notificationApi: NotificationApi = {
  list: (params) => getData('/api/notifications', params),
  unread: () => getData('/api/notifications/unread'),
  markRead: (id) => sendData('patch', `/api/notifications/${id}/read`),
  markAllRead: () => sendData('patch', '/api/notifications/read-all'),
  remove: (id) => deleteData(`/api/notifications/${id}`),
};
