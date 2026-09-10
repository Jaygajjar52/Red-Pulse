import { http } from './axios';
import type { DonorApi } from './contracts';
import type { DonorProfile, DonorProfilePayload } from '@/types';

export const donorApi: DonorApi = {
  getProfile: async () => (await http.get<DonorProfile>('/api/donors/profile')).data,
  createProfile: async (payload: DonorProfilePayload) =>
    (await http.post<DonorProfile>('/api/donors/profile', payload)).data,
  updateProfile: async (payload: DonorProfilePayload) =>
    (await http.put<DonorProfile>('/api/donors/profile', payload)).data,
  patchAvailability: async (available: boolean) =>
    (await http.patch<DonorProfile>('/api/donors/availability', { available })).data,
  getById: async (id: string) => (await http.get<DonorProfile>(`/api/donors/${id}`)).data,
};
