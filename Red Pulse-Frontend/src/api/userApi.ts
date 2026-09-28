import { http } from './axios';
import type { UserApi } from './contracts';
import type { User, UserProfileUpdate } from '@/types';

export const userApi: UserApi = {
  getMe: async () => (await http.get<User>('/api/users/me')).data,
  updateMe: async (payload: UserProfileUpdate) => (await http.put<User>('/api/users/me', payload)).data,
};
