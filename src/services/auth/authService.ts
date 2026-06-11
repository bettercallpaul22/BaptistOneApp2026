import { http } from '@/services/api/http';
import { endpoints } from '@/services/api/endpoints';
import type { AuthApiResponse, AuthData, LoginCredentials, RegisterPayload } from '@/types/auth';

export const authService = {
  login: (payload: LoginCredentials) => http.post<AuthApiResponse<AuthData>, LoginCredentials>(endpoints.auth.login, payload),
  register: (payload: RegisterPayload) => http.post<AuthApiResponse<unknown>, RegisterPayload>(endpoints.auth.register, payload),
};
