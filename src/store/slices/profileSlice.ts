import { createSlice } from '@reduxjs/toolkit';
import { storageKeys } from '@/constants/storage';
import { logout } from '@/store/slices/authSlice';
import {
  handoffLoginThunk,
  intentLogin,
  loginThunk,
  switchAccessThunk,
} from '@/store/thunks/authThunk';
import { fetchProfileCompletionThunk, updateProfileCompletionSectionThunk } from '@/store/thunks/profileThunk';
import type { ProfileCompletion, StoredProfileCompletion } from '@/types/profile';

interface ProfileState {
  data: ProfileCompletion | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const readStoredProfileCompletion = (): StoredProfileCompletion | null => {
  const value = localStorage.getItem(storageKeys.profileCompletion);

  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoredProfileCompletion;
    return parsed.data ? parsed : null;
  } catch {
    return null;
  }
};

const storedProfileCompletion = readStoredProfileCompletion();

const initialState: ProfileState = {
  data: storedProfileCompletion?.data ?? null,
  loading: false,
  error: null,
  lastFetchedAt: storedProfileCompletion?.lastFetchedAt ?? null,
};

const clearStoredProfileCompletion = () => {
  localStorage.removeItem(storageKeys.profileCompletion);
};

const resetProfileCompletionState = (state: ProfileState) => {
  state.data = null;
  state.error = null;
  state.lastFetchedAt = null;
  state.loading = false;
  clearStoredProfileCompletion();
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    clearProfileCompletion: (state) => {
      state.data = null;
      state.error = null;
      state.lastFetchedAt = null;
      clearStoredProfileCompletion();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileCompletionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileCompletionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.lastFetchedAt = action.payload.lastFetchedAt;
      })
      .addCase(fetchProfileCompletionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load profile.';
      })
      .addCase(updateProfileCompletionSectionThunk.fulfilled, (state, action) => {
        console.info('[profileSlice] profile update fulfilled', {
          data: action.payload.data,
          lastFetchedAt: action.payload.lastFetchedAt,
        });
        state.data = action.payload.data;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, resetProfileCompletionState)
      .addCase(intentLogin.fulfilled, resetProfileCompletionState)
      .addCase(handoffLoginThunk.fulfilled, resetProfileCompletionState)
      .addCase(switchAccessThunk.fulfilled, resetProfileCompletionState)
      .addCase(logout, (state) => {
        resetProfileCompletionState(state);
      });
  },
});

export const { clearProfileCompletion, clearProfileError } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;
