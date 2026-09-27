import type { User } from '@/types';
import { normalizeApiError } from '@/api/errors';

export function roleHome(role: User['role']): string {
  switch (role) {
    case 'DONOR':
      return '/donor/dashboard';
    case 'REQUESTER':
      return '/requester/dashboard';
    case 'HOSPITAL':
      return '/hospital/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

export function getAuthErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
