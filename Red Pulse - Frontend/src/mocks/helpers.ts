import type { ApiError } from '@/types';

export function mockFail(status: number, message: string, errors?: Record<string, string>): never {
  const error: ApiError = Object.assign(new Error(message), {
    name: 'ApiError',
    status,
    body: { status, message, errors, timestamp: new Date().toISOString() },
    fieldErrors: errors,
  });
  throw error;
}

export function paginate<T>(items: T[], page = 1, size = 10) {
  const start = (page - 1) * size;
  return {
    content: items.slice(start, start + size),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function id(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
