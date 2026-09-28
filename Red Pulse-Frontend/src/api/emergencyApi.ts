import { getData, sendData, wrapPageResponse } from './httpHelpers';
import type { BloodGroup, CreateEmergencyRequestPayload, EmergencyOtpDispatchPayload, EmergencyOtpRequest, EmergencyOtpRequestResponse, EmergencyOtpResponse, EmergencyOtpVerifyRequest, EmergencyOtpVerifyResponse, EmergencyRequest, EmergencyStatus, Urgency } from '@/types';
import type { EmergencyApi } from './contracts';
import { asEnumValue, asString } from './typed';

const VALID_BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'] as const;

function normalizeEmergency(em: Record<string, unknown>): EmergencyRequest {
  return {
    id: String(em.id ?? ''),
    requesterId: String(em.requesterId ?? em.bloodRequestId ?? ''),
    bloodGroup: asEnumValue<BloodGroup>(em.bloodGroup, VALID_BLOOD_GROUPS, 'O_POSITIVE') ?? 'O_POSITIVE',
    unitsRequired: Number(em.unitsRequired ?? 1),
    hospitalId: String(em.hospitalId ?? ''),
    hospitalName: asString(em.hospitalName),
    approximateLocation: asString(em.locationDescription) ?? asString(em.approximateLocation),
    emergencyLevel: asEnumValue<Urgency>(em.emergencyLevel ?? 'CRITICAL', ['NORMAL', 'URGENT', 'EMERGENCY'], 'EMERGENCY') ?? 'EMERGENCY',
    status: asEnumValue<EmergencyStatus>(em.status ?? 'OPEN', ['OPEN', 'ALERT_SENT', 'RESOLVED', 'CANCELLED'], 'OPEN') ?? 'OPEN',
    createdAt: asString(em.createdAt) ?? '',
    description: asString(em.locationDescription) ?? asString(em.description),
  };
}

export const emergencyApi: EmergencyApi = {
  create: async (payload: CreateEmergencyRequestPayload) => {
    let bloodRequestId: string | undefined = undefined;
    if (!bloodRequestId) {
      const parentRequest = await sendData<Record<string, unknown>>('post', '/api/blood-requests', {
        bloodGroup: payload.bloodGroup,
        unitsRequired: payload.unitsRequired ?? 1,
        urgency: 'CRITICAL',
        hospitalId: payload.hospitalId || undefined,
        city: asString(payload.city) ?? (typeof payload.approximateLocation === 'string' ? payload.approximateLocation.split(',')[0].trim() : 'Ahmedabad'),
        state: asString(payload.state) ?? 'Gujarat',
        additionalNotes: payload.description || 'Emergency SOS',
        requiredBy: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });
      bloodRequestId = asString(parentRequest.id) ?? undefined;
    }

    const body = {
      bloodRequestId,
      emergencyLevel: payload.emergencyLevel || 'CRITICAL',
      contactName: asString(payload.contactName) ?? 'Emergency Requester',
      contactPhone: asString(payload.contactPhone) ?? '1234567890',
      locationDescription: payload.approximateLocation || payload.description || '',
    };
    const res = await sendData<Record<string, unknown>>('post', '/api/emergency-requests', body);
    return normalizeEmergency(res);
  },
  list: async (params?: Record<string, unknown>) => {
    const raw = await getData<unknown>('/api/emergency-requests', params);
    const paged = wrapPageResponse<Record<string, unknown>>(raw);
    return {
      ...paged,
      content: paged.content.map(normalizeEmergency),
    };
  },
  get: async (id: string) => {
    const res = await getData<Record<string, unknown>>(`/api/emergency-requests/${id}`);
    return normalizeEmergency(res);
  },
  alertDonors: async (id: string) => {
    const res = await sendData<Record<string, unknown>>('post', `/api/emergency-requests/${id}/alert-donors`);
    return normalizeEmergency(res);
  },
  resolve: async (id: string) => {
    const res = await sendData<Record<string, unknown>>('patch', `/api/emergency-requests/${id}/resolve`);
    return normalizeEmergency(res);
  },
  requestOtp: async (payload: EmergencyOtpRequest): Promise<EmergencyOtpRequestResponse> => {
    return await sendData<EmergencyOtpRequestResponse>('post', '/api/emergency/otp/request', payload);
  },
  verifyOtp: async (payload: EmergencyOtpVerifyRequest): Promise<EmergencyOtpVerifyResponse> => {
    return await sendData<EmergencyOtpVerifyResponse>('post', '/api/emergency/otp/verify', payload);
  },
  verifyAndDispatch: async (payload: EmergencyOtpDispatchPayload) => {
    return await sendData<EmergencyOtpResponse>('post', '/api/emergency/verify-and-dispatch', payload);
  },
};
