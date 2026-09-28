import { getData, sendData, wrapPageResponse } from './httpHelpers';
import type { BloodGroup, DonationRecord, DonationStatus } from '@/types';
import { asEnumValue, asNumber, asString } from './typed';

const VALID_BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'] as const;

function normalizeDonation(d: Record<string, unknown>): DonationRecord {
  return {
    id: String(d.id ?? ''),
    donorId: String(d.donorId ?? ''),
    donorName: asString(d.donorName),
    hospitalId: String(d.hospitalId ?? ''),
    hospitalName: asString(d.hospitalName),
    bloodGroup: asEnumValue<BloodGroup>(d.bloodGroup, VALID_BLOOD_GROUPS, 'O_POSITIVE') ?? 'O_POSITIVE',
    units: asNumber(d.units) ?? asNumber(d.quantityUnits) ?? 1,
    status: asEnumValue<DonationStatus>(d.status ?? 'COMPLETED', ['SCHEDULED', 'COMPLETED', 'CANCELLED'], 'COMPLETED') ?? 'COMPLETED',
    donatedAt: asString(d.donatedAt) ?? asString(d.donationDate) ?? '',
    appointmentId: asString(d.appointmentId),
  };
}

export const donationApi = {
  create: async (payload: Partial<DonationRecord>) => {
    const res = await sendData<Record<string, unknown>>('post', '/api/donations', payload);
    return normalizeDonation(res);
  },
  list: async (params?: Record<string, unknown>) => {
    const raw = await getData<unknown>('/api/donations', params);
    const paged = wrapPageResponse<Record<string, unknown>>(raw);
    return {
      ...paged,
      content: paged.content.map(normalizeDonation),
    };
  },
  get: async (id: string) => {
    const res = await getData<Record<string, unknown>>(`/api/donations/${id}`);
    return normalizeDonation(res);
  },
  complete: async (id: string) => {
    const res = await sendData<Record<string, unknown>>('patch', `/api/donations/${id}/complete`);
    return normalizeDonation(res);
  },
  cancel: async (id: string) => {
    const res = await sendData<Record<string, unknown>>('patch', `/api/donations/${id}/cancel`);
    return normalizeDonation(res);
  },
};
