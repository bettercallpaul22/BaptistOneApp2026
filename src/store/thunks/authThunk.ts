import { createAsyncThunk } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { tokenStore } from '@/services/api/tokenStore';
import { toApiError } from '@/services/api/responseHandler';
import { authService } from '@/services/auth/authService';
import type { AuthData, LoginCredentials, RegisterPayload, RegistrationResult } from '@/types/auth';

export const loginThunk = createAsyncThunk<AuthData, LoginCredentials, { rejectValue: ReturnType<typeof toApiError> }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);

      if (!response.status || !response.data?.access?.token) {
        return rejectWithValue({ message: response.message || 'Unable to sign in.' });
      }

      tokenStore.setSession(response.data.access.token, response.data.access.refresh);
      localStorage.setItem(storageKeys.authData, JSON.stringify(response.data));
      localStorage.setItem(storageKeys.user, JSON.stringify(response.data.user));

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
