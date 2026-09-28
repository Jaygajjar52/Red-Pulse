import { http } from './axios';
import { asBlobResponse, getData, sendData, wrapPageResponse } from './httpHelpers';
import type { AdminApi } from './contracts';
import { compactParams } from '@/utils/searchParams';

export const adminApi: AdminApi = {
  users: async (params) => wrapPageResponse(await getData('/api/admin/users', params)),
  user: (id) => getData(`/api/admin/users/${id}`),
  blockUser: (id) => sendData('patch', `/api/admin/users/${id}/block`),
  unblockUser: (id) => sendData('patch', `/api/admin/users/${id}/unblock`),
  donors: async (params) => wrapPageResponse(await getData('/api/admin/donors', params)),
  verifyDonor: (id) => sendData('patch', `/api/admin/donors/${id}/verify`),
  hospitals: async (params) => wrapPageResponse(await getData('/api/admin/hospitals', params)),
  auditLogs: async (params) => wrapPageResponse(await getData('/api/admin/audit-logs', params)),
  auditLog: (id) => getData(`/api/admin/audit-logs/${id}`),
  filterAuditLogs: async (params) => wrapPageResponse(await getData('/api/admin/audit-logs/filter', params)),
  exportAuditLogs: async (params) => {
    const response = await http.get<Blob>('/api/admin/audit-logs/export', {
      params: params ? Object.fromEntries(compactParams({ ...params })) : undefined,
      responseType: 'blob',
    });
    return asBlobResponse(response);
  },
};
