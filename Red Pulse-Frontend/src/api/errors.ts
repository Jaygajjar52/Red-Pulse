import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiError, ApiErrorBody } from '@/types';

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'status' in error && 'body' in error);
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (axios.isAxiosError(error)) {
    return fromAxiosError(error);
  }

  const fallback: ApiError = Object.assign(new Error('Something went wrong. Please try again.'), {
    name: 'ApiError',
    status: 0,
    body: { status: 0, message: 'Something went wrong. Please try again.' },
  });
  return fallback;
}

function fromAxiosError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data;
  const message = userFacingMessage(status, data, error.message);
  const apiError: ApiError = Object.assign(new Error(message), {
    name: 'ApiError',
    status,
    body: {
      timestamp: data?.timestamp,
      status: data?.status ?? status,
      message,
      errors: data?.errors,
      code: data?.code,
    },
    fieldErrors: data?.errors,
  });
  return apiError;
}

function userFacingMessage(status: number, data: ApiErrorBody | undefined, fallback: string): string {
  const backendMessage = data?.message;
  if (backendMessage && !looksInternal(backendMessage)) return backendMessage;

  switch (status) {
    case 400:
      return 'Please check the information you entered and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'This action conflicts with the current state of the record.';
    case 422:
      return 'Some fields need attention before we can continue.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'The server encountered a problem. Please try again later.';
    case 0:
      return 'Unable to reach Red Pulse. Check your connection and try again.';
    default:
      return fallback && !looksInternal(fallback)
        ? fallback
        : 'Something went wrong. Please try again.';
  }
}

function looksInternal(message: string): boolean {
  return /exception|stack|at [a-zA-Z0-9_.]+\(|hibernate|jdbc|sql/i.test(message);
}

export function toNetworkError(config?: AxiosRequestConfig): ApiError {
  return Object.assign(new Error('Unable to reach Red Pulse. Check your connection and try again.'), {
    name: 'ApiError',
    status: 0,
    body: { status: 0, message: 'Unable to reach Red Pulse. Check your connection and try again.' },
    config,
  });
}
