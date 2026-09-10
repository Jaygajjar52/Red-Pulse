import { getData, sendData } from './httpHelpers';
import type { LocationApi } from './contracts';

export const locationApi: LocationApi = {
  getDonorLocation: (donorId) => getData(`/api/donors/${donorId}/location`),
  updateDonorLocation: (donorId, payload) => sendData('put', `/api/donors/${donorId}/location`, payload),
  nearbyDonors: (params) => getData('/api/donors/nearby', params),
  nearbyHospitals: (params) => getData('/api/hospitals/nearby', params),
};
