import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { tokenStore } from '@/services/api/tokenStore';
import { loginThunk, registerThunk } from '@/store/thunks/authThunk';
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
  error: null,
  registration: readStoredRegistration(),
};

const applyUnauthenticatedState = (state: AuthState) => {
  state.accessToken = null;
  state.isAuthenticated = false;
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
        state.loading = false;
        state.authData = action.payload;
        state.user = action.payload.user;
        state.accessToken = action.payload.access.token;
        state.isAuthenticated = true;
        state.isAuthChecked = true;
        state.hasKnownUser = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to sign in.';
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
      });
  },
});

export const { applyAuthCheck, clearAuthError, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
