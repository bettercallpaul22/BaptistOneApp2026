import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { tokenStore } from '@/services/api/tokenStore';
import { toApiError } from '@/services/api/responseHandler';
import { authService } from '@/services/auth/authService';
import type {
  AuthData,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  HandoffLoginPayload,
  IntentLoginPayload,
  LoginCredentials,
  RegisterPayload,
  RegistrationResult,
  SetPasswordPayload,
  SetPasswordResult,
} from '@/types/auth';

const persistAuthSession = (authData: AuthData) => {
  tokenStore.setSession(authData.access.token, authData.access.refresh);
  localStorage.setItem(storageKeys.authData, JSON.stringify(authData));
  localStorage.setItem(storageKeys.user, JSON.stringify(authData.user));
};

export const loginThunk = createAsyncThunk<AuthData, LoginCredentials, { rejectValue: ReturnType<typeof toApiError> }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);

      if (!response.status || !response.data?.access?.token) {
        return rejectWithValue({ message: response.message || 'Unable to sign in.' });
      }

      persistAuthSession(response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const intentLogin = createAsyncThunk<AuthData, IntentLoginPayload, { rejectValue: ReturnType<typeof toApiError> }>(
  'auth/intentLogin',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.intentLogin(payload);

      if (!response.status || !response.data?.access?.token) {
        return rejectWithValue({ message: response.message || 'Unable to verify your email.' });
      }

      persistAuthSession(response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const handoffLoginThunk = createAsyncThunk<AuthData, HandoffLoginPayload, { rejectValue: ReturnType<typeof toApiError> }>(
  'auth/handoffLogin',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.handoffLogin(payload);

      if (!response.status || !response.data?.access?.token) {
        return rejectWithValue({ message: response.message || 'Unable to complete handoff login.' });
      }

      persistAuthSession(response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const registerThunk = createAsyncThunk<RegistrationResult, RegisterPayload, { rejectValue: ReturnType<typeof toApiError> }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);

      if (!response.status) {
        return rejectWithValue({ message: response.message || 'Unable to create account.' });
      }

      const result = {
        email: payload.email,
        message: response.message || 'A verification link has been sent to your email address.',
      };

      localStorage.setItem(storageKeys.registration, JSON.stringify(result));

      return result;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const forgotPasswordThunk = createAsyncThunk<
  ForgotPasswordResult,
  ForgotPasswordPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('auth/forgotPassword', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.forgotPassword(payload);

    if (!response.status) {
      return rejectWithValue({ message: response.message || 'Unable to send reset code.' });
    }

    return {
      email: payload.email,
      message: response.message || 'A password reset code has been sent to your email.',
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const setPasswordThunk = createAsyncThunk<
  SetPasswordResult,
  SetPasswordPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('auth/setPassword', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.setPassword(payload);

    if (!response.status) {
      return rejectWithValue({ message: response.message || 'Unable to reset password.' });
    }

    return {
      email: payload.email,
      message: response.message || 'Your password has been reset successfully.',
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
