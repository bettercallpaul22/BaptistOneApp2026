import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchAuthAccessThunk } from '@/store/thunks/authAccessThunk';
import type { AuthProfile, UserAccess } from '@/types/auth';

interface AuthAccessState {
  userAccess: UserAccess[];
  currentAccess: UserAccess | null;
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthAccessState = {
  userAccess: [],
  currentAccess: null,
  profile: null,
  loading: false,
  error: null,
};

export const authAccessSlice = createSlice({
  name: 'authAccess',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthAccessThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuthAccessThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userAccess = action.payload.userAccess;
        state.currentAccess = action.payload.currentAccess;
        state.profile = action.payload.profile;
      })
      .addCase(fetchAuthAccessThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to fetch user access.';
      })
      .addCase(logout, () => initialState);
  },
});

export const authAccessReducer = authAccessSlice.reducer;
