import { http } from './axios';
import type { AuthApi } from './contracts';
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, User } from '@/types';
import { asEnumValue, asString, ensureRecord } from './typed';

type RawUser = Record<string, unknown>;

async function fetchCurrentUser(token?: string): Promise<User> {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  try {
    const res = await http.get<Record<string, unknown>>('/api/users/me', config);
    return normalizeUserData(ensureRecord(res.data) ?? {});
  } catch {
    const res = await http.get<Record<string, unknown>>('/api/auth/me', config);
    return normalizeUserData(ensureRecord(res.data) ?? {});
  }
}

function normalizeUserData(raw: RawUser | null | undefined): User {
  if (!raw) throw new Error('User payload is missing');

  const authorities = Array.isArray(raw.authorities) ? raw.authorities : [];
  const firstAuthority = authorities.find((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const authority = entry as Record<string, unknown>;
    return typeof authority.authority === 'string';
  }) as Record<string, unknown> | undefined;

  const roleFromAuthority = typeof firstAuthority?.authority === 'string' ? firstAuthority.authority.replace('ROLE_', '') : undefined;
  const role = asEnumValue<User['role']>(raw.role ?? roleFromAuthority, ['DONOR', 'REQUESTER', 'HOSPITAL', 'ADMIN'], 'DONOR') ?? 'DONOR';

  return {
    id: String(raw.id ?? ''),
    email: asString(raw.email) ?? asString(raw.username) ?? '',
    firstName: asString(raw.firstName) ?? asString(raw.name) ?? '',
    lastName: asString(raw.lastName) ?? '',
    phone: asString(raw.phone) ?? asString(raw.phoneNumber),
    role,
    status: asEnumValue<User['status']>(raw.status, ['ACTIVE', 'BLOCKED', 'PENDING'], 'ACTIVE') ?? 'ACTIVE',
    city: asString(raw.city),
    state: asString(raw.state),
    hospitalId: asString(raw.hospitalId),
    donorId: asString(raw.donorId),
    createdAt: asString(raw.createdAt) ?? new Date().toISOString(),
  };
}

export const authApi: AuthApi = {
  register: async (payload: RegisterRequest) => {
    const data = (await http.post<AuthResponse>('/api/auth/register', payload)).data;
    if (!data.user && data.accessToken) {
      data.user = await fetchCurrentUser(data.accessToken);
    } else if (data.user) {
      data.user = normalizeUserData(ensureRecord(data.user) ?? {});
    }
    return data;
  },
  login: async (payload: LoginRequest) => {
    const data = (await http.post<AuthResponse>('/api/auth/login', payload)).data;
    if (!data.user && data.accessToken) {
      data.user = await fetchCurrentUser(data.accessToken);
    } else if (data.user) {
      data.user = normalizeUserData(ensureRecord(data.user) ?? {});
    }
    return data;
  },
  me: async () => await fetchCurrentUser(),
  refresh: async (refreshToken: string) => {
    const data = (await http.post<AuthResponse>('/api/auth/refresh', { refreshToken })).data;
    if (!data.user && data.accessToken) {
      data.user = await fetchCurrentUser(data.accessToken);
    } else if (data.user) {
      data.user = normalizeUserData(ensureRecord(data.user) ?? {});
    }
    return data;
  },
  forgotPassword: async (payload: ForgotPasswordRequest) => {
    await http.post('/api/auth/forgot-password', payload);
  },
  resetPassword: async (payload: ResetPasswordRequest) => {
    await http.post('/api/auth/reset-password', payload);
  },
};
