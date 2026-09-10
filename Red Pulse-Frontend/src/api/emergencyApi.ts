import { getData, sendData } from './httpHelpers';
import type { EmergencyApi } from './contracts';

export const emergencyApi: EmergencyApi = {
  create: (payload) => sendData('post', '/api/emergency-requests', payload),
  list: (params) => getData('/api/emergency-requests', params),
  get: (id) => getData(`/api/emergency-requests/${id}`),
  alertDonors: (id) => sendData('post', `/api/emergency-requests/${id}/alert-donors`),
  resolve: (id) => sendData('patch', `/api/emergency-requests/${id}/resolve`),
};
