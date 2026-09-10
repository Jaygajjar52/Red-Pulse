import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/constants/env';
import { STORAGE_KEYS } from '@/constants/storage';
import { normalizeApiError } from './errors';

type RefreshHandler = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let refreshHandler: RefreshHandler | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function registerAuthHandlers(handlers: {
  refresh: RefreshHandler;
  onUnauthorized: UnauthorizedHandler;
}): void {
  refreshHandler = handlers.refresh;
  unauthorizedHandler = handlers.onUnauthorized;
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function persistTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes('/api/auth/refresh');

    if (status === 401 && original && !original._retry && !isRefreshCall && refreshHandler) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshHandler().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (!newToken) {
          unauthorizedHandler?.();
          return Promise.reject(normalizeApiError(error));
        }
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      } catch {
        unauthorizedHandler?.();
        return Promise.reject(normalizeApiError(error));
      }
    }

    if (status === 401) {
      unauthorizedHandler?.();
    }

    return Promise.reject(normalizeApiError(error));
  },
);
