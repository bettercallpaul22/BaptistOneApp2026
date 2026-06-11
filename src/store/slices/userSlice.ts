import { createSlice } from '@reduxjs/toolkit';
import { fetchProfileThunk } from '@/store/thunks/userThunk';
import type { User } from '@/types/user';

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message?: string })?.message ?? 'Unable to load profile.';
      });
  },
});

export const userReducer = userSlice.reducer;
