import { getData, sendData } from './httpHelpers';
import type { BloodRequestApi } from './contracts';

export const bloodRequestApi: BloodRequestApi = {
  create: (payload) => sendData('post', '/api/blood-requests', payload),
  list: (params) => getData('/api/blood-requests', params),
  get: (id) => getData(`/api/blood-requests/${id}`),
  update: (id, payload) => sendData('put', `/api/blood-requests/${id}`, payload),
  cancel: (id) => sendData('patch', `/api/blood-requests/${id}/cancel`),
  fulfill: (id) => sendData('patch', `/api/blood-requests/${id}/fulfill`),
  my: (params) => getData('/api/blood-requests/my', params),
  emergency: (params) => getData('/api/blood-requests/emergency', params),
};
