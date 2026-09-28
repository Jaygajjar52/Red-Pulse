import { getData, sendData } from './httpHelpers';
import type { MatchingApi } from './contracts';

export const matchingApi: MatchingApi = {
  list: (requestId) => getData(`/api/blood-requests/${requestId}/matches`),
  nearby: (requestId) => getData(`/api/blood-requests/${requestId}/matches/nearby`),
  match: (requestId) => sendData('post', `/api/blood-requests/${requestId}/match`),
  notify: (requestId, donorId) => sendData('post', `/api/blood-requests/${requestId}/match/${donorId}/notify`),
  matchScore: (donorId, requestId) => getData(`/api/donors/${donorId}/match-score/${requestId}`),
};
