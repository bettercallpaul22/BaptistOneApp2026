import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { fetchMyMinistriesThunk, fetchChurchMinistriesThunk } from '@/store/thunks/ministryThunk';
import type { ChurchMinistry, MyMinistry } from '@/types/ministry';

interface MinistryState {
  myMinistries: MyMinistry[];
  myMinistriesLoading: boolean;
  myMinistriesError: string | null;
  churchMinistries: ChurchMinistry[];
  churchMinistriesLoading: boolean;
  churchMinistriesError: string | null;
}

const initialState: MinistryState = {
  myMinistries: [],
  myMinistriesLoading: false,
  myMinistriesError: null,
  churchMinistries: [],
  churchMinistriesLoading: false,
  churchMinistriesError: null,
};

export const ministrySlice = createSlice({
  name: 'ministry',
  initialState,
  reducers: {
    clearMyMinistriesError: (state) => {
      state.myMinistriesError = null;
    },
    clearChurchMinistriesError: (state) => {
      state.churchMinistriesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMinistriesThunk.pending, (state) => {
        state.myMinistriesLoading = true;
        state.myMinistriesError = null;
      })
      .addCase(fetchMyMinistriesThunk.fulfilled, (state, action) => {
        state.myMinistriesLoading = false;
        state.myMinistries = action.payload.data;
        state.myMinistriesError = null;
      })
      .addCase(fetchMyMinistriesThunk.rejected, (state, action) => {
        state.myMinistriesLoading = false;
        state.myMinistriesError = action.payload?.message ?? 'Unable to load your ministries.';
      })
      .addCase(fetchChurchMinistriesThunk.pending, (state) => {
        state.churchMinistriesLoading = true;
        state.churchMinistriesError = null;
      })
      .addCase(fetchChurchMinistriesThunk.fulfilled, (state, action) => {
        state.churchMinistriesLoading = false;
        state.churchMinistries = action.payload.data;
        state.churchMinistriesError = null;
      })
      .addCase(fetchChurchMinistriesThunk.rejected, (state, action) => {
        state.churchMinistriesLoading = false;
        state.churchMinistriesError = action.payload?.message ?? 'Unable to load church ministries.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearMyMinistriesError, clearChurchMinistriesError } = ministrySlice.actions;
export const ministryReducer = ministrySlice.reducer;
