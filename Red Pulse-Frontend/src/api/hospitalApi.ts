import { deleteData, getData, sendData } from './httpHelpers';
import type { HospitalApi } from './contracts';

export const hospitalApi: HospitalApi = {
  list: (params) => getData('/api/hospitals', params),
  get: (id) => getData(`/api/hospitals/${id}`),
  create: (payload) => sendData('post', '/api/hospitals', payload),
  update: (id, payload) => sendData('put', `/api/hospitals/${id}`, payload),
  remove: (id) => deleteData(`/api/hospitals/${id}`),
  bloodRequests: (id, params) => getData(`/api/hospitals/${id}/blood-requests`, params),
};
