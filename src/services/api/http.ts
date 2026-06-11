import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './axios';

export type ApiRequestHeaders = AxiosRequestConfig['headers'];
export type ApiRequestConfig<TData = unknown> = Omit<AxiosRequestConfig<TData>, 'data' | 'method' | 'url'> & {
  headers?: ApiRequestHeaders;
};

export const http = {
  request: async <TResponse, TData = unknown>(config: AxiosRequestConfig<TData>) => {
    const { data } = await apiClient.request<TResponse>(config);
    return data;
  },

  get: async <TResponse>(url: string, config?: ApiRequestConfig) => {
    const { data } = await apiClient.get<TResponse>(url, config);
    return data;
  },

  post: async <TResponse, TData = unknown>(url: string, payload?: TData, config?: ApiRequestConfig<TData>) => {
    const { data } = await apiClient.post<TResponse>(url, payload, config);
    return data;
  },

  put: async <TResponse, TData = unknown>(url: string, payload?: TData, config?: ApiRequestConfig<TData>) => {
    const { data } = await apiClient.put<TResponse>(url, payload, config);
    return data;
  },

  patch: async <TResponse, TData = unknown>(url: string, payload?: TData, config?: ApiRequestConfig<TData>) => {
    const { data } = await apiClient.patch<TResponse>(url, payload, config);
    return data;
  },

  delete: async <TResponse>(url: string, config?: ApiRequestConfig) => {
    const { data } = await apiClient.delete<TResponse>(url, config);
    return data;
  },
};
