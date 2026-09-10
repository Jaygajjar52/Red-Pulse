import { getData, sendData } from './httpHelpers';
import type { AppointmentApi } from './contracts';

export const appointmentApi: AppointmentApi = {
  create: (payload) => sendData('post', '/api/appointments', payload),
  list: (params) => getData('/api/appointments', params),
  get: (id) => getData(`/api/appointments/${id}`),
  byDonor: (donorId, params) => getData(`/api/donors/${donorId}/appointments`, params),
  byHospital: (hospitalId, params) => getData(`/api/hospitals/${hospitalId}/appointments`, params),
  confirm: (id) => sendData('patch', `/api/appointments/${id}/confirm`),
  complete: (id) => sendData('patch', `/api/appointments/${id}/complete`),
  cancel: (id) => sendData('patch', `/api/appointments/${id}/cancel`),
};
