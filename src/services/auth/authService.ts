import { http } from '@/services/api/http';
import { endpoints } from '@/services/api/endpoints';
import type {
  AuthApiResponse,
  AuthData,
  ForgotPasswordPayload,
  HandoffLoginPayload,
  IntentLoginPayload,
  LoginCredentials,
  RegisterPayload,
  SetPasswordPayload,
} from '@/types/auth';

export const authService = {
  login: (payload: LoginCredentials) => http.post<AuthApiResponse<AuthData>, LoginCredentials>(endpoints.auth.login, payload),
  intentLogin: (payload: IntentLoginPayload) => http.post<AuthApiResponse<AuthData>, IntentLoginPayload>(endpoints.auth.intent, payload),
  handoffLogin: (payload: HandoffLoginPayload) => http.post<AuthApiResponse<AuthData>, HandoffLoginPayload>(endpoints.auth.handoffLogin, payload),
  register: (payload: RegisterPayload) => http.post<AuthApiResponse<unknown>, RegisterPayload>(endpoints.auth.register, payload),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    http.post<AuthApiResponse<unknown>, ForgotPasswordPayload>(endpoints.auth.forgotPassword, payload),
  setPassword: (payload: SetPasswordPayload) =>
    http.post<AuthApiResponse<unknown>, SetPasswordPayload>(endpoints.auth.setPassword, payload),
};
