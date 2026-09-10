import { getData, sendData } from './httpHelpers';
import type { DonationApi } from './contracts';

export const donationApi: DonationApi = {
  create: (payload) => sendData('post', '/api/donations', payload),
  list: (params) => getData('/api/donations', params),
  get: (id) => getData(`/api/donations/${id}`),
  complete: (id) => sendData('patch', `/api/donations/${id}/complete`),
  cancel: (id) => sendData('patch', `/api/donations/${id}/cancel`),
};
