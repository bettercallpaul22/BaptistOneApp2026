import axios from 'axios';
import { env } from '@/config/env';
import { installInterceptors } from './interceptors';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

installInterceptors(apiClient);
