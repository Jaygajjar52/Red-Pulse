import { http } from './axios';
import type { DonorApi } from './contracts';
import type { BloodGroup, DonorProfile, DonorProfilePayload, VerificationStatus } from '@/types';
import { asBoolean, asEnumValue, asNumber, asString } from './typed';

const VALID_BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'] as const;

function normalizeDonorProfile(raw: Record<string, unknown>): DonorProfile {
  const bloodGroup = asEnumValue<BloodGroup>(raw.bloodGroup, VALID_BLOOD_GROUPS, 'O_POSITIVE') ?? 'O_POSITIVE';
  const verificationStatus = asEnumValue<VerificationStatus>(
    raw.verificationStatus ?? (raw.verified ? 'VERIFIED' : 'UNVERIFIED'),
    ['VERIFIED', 'UNVERIFIED', 'PENDING'],
    'UNVERIFIED',
  ) ?? 'UNVERIFIED';

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? ''),
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    email: String(raw.email ?? ''),
    phone: asString(raw.phone),
    bloodGroup,
    city: String(raw.city ?? ''),
    state: String(raw.state ?? ''),
    available: raw.availabilityStatus === 'AVAILABLE' || raw.available === true || asBoolean(raw.available) === true || asBoolean(raw.availabilityStatus) === true,
    verificationStatus,
    lastDonationDate: asString(raw.lastDonationDate),
    dateOfBirth: asString(raw.dateOfBirth),
    age: asNumber(raw.age),
    gender: asString(raw.gender),
    weight: asNumber(raw.weight),
    latitude: asNumber(raw.latitude),
    longitude: asNumber(raw.longitude),
    isEligible: asBoolean(raw.isEligible),
    ineligibilityReason: asString(raw.ineligibilityReason),
    cooldownDaysRemaining: asNumber(raw.cooldownDaysRemaining),
  };
}

export const donorApi: DonorApi = {
  getProfile: async () => {
    const res = await http.get('/api/users/donor-profile');
    return normalizeDonorProfile((res.data ?? {}) as Record<string, unknown>);
  },
  createProfile: async (payload: DonorProfilePayload) => {
    const body = {
      bloodGroup: payload.bloodGroup,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      weight: Number(payload.weight),
      city: payload.city,
      state: payload.state,
      latitude: payload.latitude ?? 23.0225,
      longitude: payload.longitude ?? 72.5714,
    };
    const res = await http.post('/api/users/donor-profile', body);
    if (payload.available !== undefined) {
      await http.patch('/api/users/donor-profile/availability', {
        availabilityStatus: payload.available ? 'AVAILABLE' : 'UNAVAILABLE',
      });
    }
    return normalizeDonorProfile((res.data ?? {}) as Record<string, unknown>);
  },
  updateProfile: async (payload: DonorProfilePayload) => {
    const body = {
      bloodGroup: payload.bloodGroup,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      weight: Number(payload.weight),
      city: payload.city,
      state: payload.state,
      latitude: payload.latitude ?? 23.0225,
      longitude: payload.longitude ?? 72.5714,
    };
    const res = await http.post('/api/users/donor-profile', body);
    if (payload.available !== undefined) {
      await http.patch('/api/users/donor-profile/availability', {
        availabilityStatus: payload.available ? 'AVAILABLE' : 'UNAVAILABLE',
      });
    }
    return normalizeDonorProfile((res.data ?? {}) as Record<string, unknown>);
  },
  patchAvailability: async (available: boolean) => {
    const res = await http.patch('/api/users/donor-profile/availability', {
      availabilityStatus: available ? 'AVAILABLE' : 'UNAVAILABLE',
    });
    return normalizeDonorProfile((res.data ?? {}) as Record<string, unknown>);
  },
  getById: async (id: string) => {
    const res = await http.get(`/api/users/donors/${id}`);
    return normalizeDonorProfile((res.data ?? {}) as Record<string, unknown>);
  },
};
