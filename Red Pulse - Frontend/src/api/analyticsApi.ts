import { getData } from './httpHelpers';
import type { AnalyticsApi } from './contracts';

export const analyticsApi: AnalyticsApi = {
  overview: () => getData('/api/admin/analytics/overview'),
  donations: (params) => getData('/api/admin/analytics/donations', params),
  bloodRequests: (params) => getData('/api/admin/analytics/blood-requests', params),
  inventory: () => getData('/api/admin/analytics/inventory'),
  emergencyRequests: (params) => getData('/api/admin/analytics/emergency-requests', params),
  users: () => getData('/api/admin/analytics/users'),
  bloodGroups: () => getData('/api/admin/analytics/blood-groups'),
};
