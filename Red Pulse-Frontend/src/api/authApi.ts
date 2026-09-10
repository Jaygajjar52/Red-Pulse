import { http } from './axios';
import type { AuthApi } from './contracts';
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, User } from '@/types';

export const authApi: AuthApi = {
  register: async (payload: RegisterRequest) => (await http.post<AuthResponse>('/api/auth/register', payload)).data,
  login: async (payload: LoginRequest) => (await http.post<AuthResponse>('/api/auth/login', payload)).data,
  me: async () => (await http.get<User>('/api/auth/me')).data,
  refresh: async (refreshToken: string) => (await http.post<AuthResponse>('/api/auth/refresh', { refreshToken })).data,
  forgotPassword: async (payload: ForgotPasswordRequest) => {
    await http.post('/api/auth/forgot-password', payload);
  },
  resetPassword: async (payload: ResetPasswordRequest) => {
    await http.post('/api/auth/reset-password', payload);
  },
};
