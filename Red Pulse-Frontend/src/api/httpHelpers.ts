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
