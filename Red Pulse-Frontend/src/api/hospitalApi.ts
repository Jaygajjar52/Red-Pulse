import { deleteData, getData, sendData, wrapPageResponse } from './httpHelpers';
import type { Hospital, HospitalStatus, HospitalPayload } from '@/types';
import type { HospitalApi } from './contracts';
import { asEnumValue, asString } from './typed';

function normalizeHospital(h: Record<string, unknown>): Hospital {
  return {
    id: String(h.id ?? ''),
    name: String(h.name ?? h.hospitalName ?? ''),
    registrationNumber: asString(h.registrationNumber) ?? '',
    email: asString(h.email),
    phone: asString(h.phone),
    address: String(h.address ?? ''),
    city: String(h.city ?? ''),
    state: String(h.state ?? ''),
    status: asEnumValue<HospitalStatus>(h.status ?? (h.isActive ? 'ACTIVE' : 'INACTIVE'), ['ACTIVE', 'INACTIVE', 'PENDING'], 'ACTIVE') ?? 'ACTIVE',
    latitude: Number(h.latitude) || undefined,
    longitude: Number(h.longitude) || undefined,
  };
}

export const hospitalApi: HospitalApi = {
  list: async (params?: Record<string, unknown>) => {
    const raw = await getData<unknown>('/api/hospitals', params);
    const paged = wrapPageResponse<Record<string, unknown>>(raw);
    return {
      ...paged,
      content: paged.content.map(normalizeHospital),
    };
  },
  get: async (id: string) => {
    const res = await getData<Record<string, unknown>>(`/api/hospitals/${id}`);
    return normalizeHospital(res);
  },
  getMe: async () => {
    const res = await getData<Record<string, unknown>>('/api/hospitals/me');
    return normalizeHospital(res);
  },
  create: async (payload: HospitalPayload) => {
    const body: Record<string, unknown> = {
      ...payload,
      hospitalName: asString(payload.hospitalName) ?? asString(payload.name) ?? '',
      registrationNumber: asString(payload.registrationNumber) ?? 'REG-' + Date.now().toString().slice(-6),
    };
    const res = await sendData<Record<string, unknown>>('post', '/api/hospitals', body);
    return normalizeHospital(res);
  },
  update: async (id: string, payload: HospitalPayload) => {
    const body: Record<string, unknown> = {
      ...payload,
      hospitalName: asString(payload.hospitalName) ?? asString(payload.name) ?? '',
      registrationNumber: asString(payload.registrationNumber) ?? 'REG-' + Date.now().toString().slice(-6),
    };
    const res = await sendData<Record<string, unknown>>('put', `/api/hospitals/${id}`, body);
    return normalizeHospital(res);
  },
  remove: async (id: string) => {
    await deleteData(`/api/hospitals/${id}`);
  },
  bloodRequests: async (id: string, params?: Record<string, unknown>) => {
    const raw = await getData<unknown>(`/api/hospitals/${id}/blood-requests`, params);
    return wrapPageResponse(raw);
  },
};
