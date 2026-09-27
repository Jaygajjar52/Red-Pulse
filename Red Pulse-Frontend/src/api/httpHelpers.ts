import type { AxiosResponse } from 'axios';
import { http } from './axios';
import { compactParams } from '@/utils/searchParams';

export function toQuery(params?: Record<string, unknown>): Record<string, string> | undefined {
  if (!params) return undefined;
  const search = compactParams(params);
  const result: Record<string, string> = {};
  search.forEach((value, key) => {
    result[key] = value;
  });
  return Object.keys(result).length ? result : undefined;
}

export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await http.get<T>(url, { params: toQuery(params) });
  return response.data;
}

export async function sendData<T, B = unknown>(method: 'post' | 'put' | 'patch', url: string, body?: B): Promise<T> {
  const response = await http.request<T>({ method, url, data: body });
  return response.data;
}

export async function deleteData<T = void>(url: string): Promise<T> {
  const response = await http.delete<T>(url);
  return response.data;
}

export function asBlobResponse(response: AxiosResponse<Blob>): { data: Blob; contentDisposition?: string } {
  return {
    data: response.data,
    contentDisposition: response.headers['content-disposition'] as string | undefined,
  };
}

export function wrapPageResponse<T>(data: unknown): { content: T[]; page: number; size: number; totalElements: number; totalPages: number } {
  if (Array.isArray(data)) {
    return {
      content: data as T[],
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }
  if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as { content: unknown }).content)) {
    return data as { content: T[]; page: number; size: number; totalElements: number; totalPages: number };
  }
  return {
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
  };
}
