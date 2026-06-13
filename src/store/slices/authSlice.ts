import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { tokenStore } from '@/services/api/tokenStore';
import {
  forgotPasswordThunk,
  handoffLoginThunk,
  intentLogin,
  loginThunk,
  registerThunk,
  setPasswordThunk,
} from '@/store/thunks/authThunk';
import { getStoredAuthStatus, hasStoredUserData, readStoredAuthData, type StoredAuthStatus } from '@/utils/authToken';
import type { AuthData, AuthUser, RegistrationResult } from '@/types/auth';

const storedAuthData = readStoredAuthData();
const storedAuthStatus = getStoredAuthStatus();

const readStoredRegistration = () => {
  const value = localStorage.getItem(storageKeys.registration);

  if (!value) return null;

  try {
    return JSON.parse(value) as RegistrationResult;
  } catch {
    return null;
  }
};

interface AuthState {
  authData: AuthData | null;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  hasKnownUser: boolean;
  loading: boolean;
  registerLoading: boolean;
  forgotPasswordLoading: boolean;
  setPasswordLoading: boolean;
  error: string | null;
  registration: RegistrationResult | null;
}

const initialState: AuthState = {
  authData: storedAuthData,
  user: storedAuthData?.user ?? null,
  accessToken: storedAuthStatus.status === 'authenticated' ? storedAuthStatus.accessToken : null,
  isAuthenticated: storedAuthStatus.status === 'authenticated',
  isAuthChecked: false,
  hasKnownUser: hasStoredUserData(),
  loading: false,
  registerLoading: false,
  forgotPasswordLoading: false,
  setPasswordLoading: false,
  error: null,
  registration: readStoredRegistration(),
};

const applyUnauthenticatedState = (state: AuthState) => {
  state.accessToken = null;
  state.isAuthenticated = false;
};

const applyAuthenticatedState = (state: AuthState, authData: AuthData) => {
  state.loading = false;
  state.authData = authData;
  state.user = authData.user;
  state.accessToken = authData.access.token;
  state.isAuthenticated = true;
  state.isAuthChecked = true;
  state.hasKnownUser = true;
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    applyAuthCheck: (state, action: PayloadAction<StoredAuthStatus>) => {
      state.isAuthChecked = true;
      state.authData = action.payload.authData;
      state.user = action.payload.authData?.user ?? null;
      state.hasKnownUser = action.payload.hasKnownUser;

      if (action.payload.status === 'authenticated') {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        return;
      }

      applyUnauthenticatedState(state);
    },
    logout: (state) => {
      tokenStore.clear();
      localStorage.removeItem(storageKeys.memberAccount);
      localStorage.removeItem(storageKeys.profileCompletion);
      applyUnauthenticatedState(state);
      state.isAuthChecked = true;
      state.hasKnownUser = Boolean(state.authData || state.user);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        applyAuthenticatedState(state, action.payload);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to sign in.';
      })
      .addCase(intentLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(intentLogin.fulfilled, (state, action) => {
        applyAuthenticatedState(state, action.payload);
      })
      .addCase(intentLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to verify your email.';
      })
      .addCase(handoffLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handoffLoginThunk.fulfilled, (state, action) => {
        applyAuthenticatedState(state, action.payload);
      })
      .addCase(handoffLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to complete handoff login.';
      })
      .addCase(registerThunk.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.registration = action.payload;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.registerLoading = false;
        state.error = action.payload?.message ?? 'Unable to create account.';
      })
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.error = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
      })
      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.error = action.payload?.message ?? 'Unable to send reset code.';
      })
      .addCase(setPasswordThunk.pending, (state) => {
        state.setPasswordLoading = true;
        state.error = null;
      })
      .addCase(setPasswordThunk.fulfilled, (state) => {
        state.setPasswordLoading = false;
      })
      .addCase(setPasswordThunk.rejected, (state, action) => {
        state.setPasswordLoading = false;
        state.error = action.payload?.message ?? 'Unable to reset password.';
      });
  },
});

export const { applyAuthCheck, clearAuthError, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
