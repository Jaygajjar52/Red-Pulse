import { http } from './axios';
import { asBlobResponse } from './httpHelpers';
import type { ReportApi, ReportType } from './contracts';
import { compactParams } from '@/utils/searchParams';

const PATHS: Record<ReportType, string> = {
  donations: '/api/admin/reports/donations',
  'blood-requests': '/api/admin/reports/blood-requests',
  inventory: '/api/admin/reports/inventory',
  donors: '/api/admin/reports/donors',
  hospitals: '/api/admin/reports/hospitals',
  'emergency-requests': '/api/admin/reports/emergency-requests',
};

export const reportApi: ReportApi = {
  download: async (type, filters) => {
    const response = await http.get<Blob>(PATHS[type], {
      params: Object.fromEntries(compactParams({ ...filters })),
      responseType: 'blob',
    });
    return asBlobResponse(response);
  },
};
