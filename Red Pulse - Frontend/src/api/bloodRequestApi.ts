import { getData, sendData, wrapPageResponse } from './httpHelpers';
import type { BloodRequestApi } from './contracts';
import type { BloodGroup, BloodRequest, RequestStatus, Urgency } from '@/types';
import { asEnumValue, asString } from './typed';

type RawBloodRequest = Record<string, unknown>;

function normalizeBloodRequest(req: RawBloodRequest): BloodRequest {
  return {
    id: String(req.id ?? ''),
    requesterId: String(req.requesterId ?? ''),
    requesterName: asString(req.requesterName),
    hospitalId: String(req.hospitalId ?? ''),
    hospitalName: asString(req.hospitalName),
    bloodGroup: asEnumValue<BloodGroup>(req.bloodGroup, ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'], 'O_POSITIVE') ?? 'O_POSITIVE',
    unitsRequired: Number(req.unitsRequired ?? 1),
    urgency: asEnumValue<Urgency>(req.urgency, ['NORMAL', 'URGENT', 'EMERGENCY'], 'NORMAL') ?? 'NORMAL',
    status: asEnumValue<RequestStatus>(req.status, ['PENDING', 'MATCHED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'], 'PENDING') ?? 'PENDING',
    requiredDate: asString(req.requiredDate) ?? asString(req.requiredBy) ?? '',
    city: asString(req.city),
    state: asString(req.state),
    description: asString(req.description) ?? asString(req.additionalNotes),
    createdAt: asString(req.createdAt) ?? '',
  };
}

export const bloodRequestApi: BloodRequestApi = {
  create: async (payload) => {
    const rawUrgency = asString(payload.urgency);
    const urgency = rawUrgency === 'EMERGENCY' ? 'EMERGENCY' : (rawUrgency ?? 'NORMAL');
    const rawDate = asString(payload.requiredDate) ?? asString(payload.requiredBy);
    const requiredBy = rawDate ? rawDate.split('T')[0] : undefined;
    const body = {
      ...payload,
      urgency,
      city: asString(payload.city) ?? 'Ahmedabad',
      requiredBy,
      additionalNotes: asString(payload.additionalNotes) ?? asString(payload.description),
    };
    const res = await sendData<RawBloodRequest>('post', '/api/blood-requests', body);
    return normalizeBloodRequest(res);
  },
  list: async (params) => {
    const raw = await getData<unknown>('/api/blood-requests', params);
    const paged = wrapPageResponse<RawBloodRequest>(raw);
    return { ...paged, content: paged.content.map(normalizeBloodRequest) };
  },
  get: async (id) => {
    const res = await getData<RawBloodRequest>(`/api/blood-requests/${id}`);
    return normalizeBloodRequest(res);
  },
  update: async (id, payload) => {
    const res = await sendData<RawBloodRequest>('put', `/api/blood-requests/${id}`, payload);
    return normalizeBloodRequest(res);
  },
  cancel: async (id) => {
    const res = await sendData<RawBloodRequest>('patch', `/api/blood-requests/${id}/cancel`);
    return normalizeBloodRequest(res);
  },
  fulfill: async (id) => {
    const res = await sendData<RawBloodRequest>('patch', `/api/blood-requests/${id}/fulfill`);
    return normalizeBloodRequest(res);
  },
  my: async (params) => {
    const raw = await getData<unknown>('/api/blood-requests/my', params);
    const paged = wrapPageResponse<RawBloodRequest>(raw);
    return { ...paged, content: paged.content.map(normalizeBloodRequest) };
  },
  emergency: async (params) => {
    const raw = await getData<unknown>('/api/blood-requests/emergency', params);
    const paged = wrapPageResponse<RawBloodRequest>(raw);
    return { ...paged, content: paged.content.map(normalizeBloodRequest) };
  },
};
