import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { createGivingThunk, fetchGivingConfigThunk } from '@/store/thunks/givingThunk';
import type { CreateGivingResponse, GivingConfig } from '@/types/giving';

interface GivingState {
  config: GivingConfig | null;
  configChurchId: string | null;
  configLoading: boolean;
  configError: string | null;
  configLastFetchedAt: string | null;
  paymentLoading: boolean;
  paymentError: string | null;
  paymentResult: CreateGivingResponse | null;
}

const initialState: GivingState = {
  config: null,
  configChurchId: null,
  configLoading: false,
  configError: null,
  configLastFetchedAt: null,
  paymentLoading: false,
  paymentError: null,
  paymentResult: null,
};

export const givingSlice = createSlice({
  name: 'giving',
  initialState,
  reducers: {
    clearGivingConfigStatus: (state) => {
      state.configError = null;
    },
    clearGivingPaymentStatus: (state) => {
      state.paymentLoading = false;
      state.paymentError = null;
      state.paymentResult = null;
    },
    clearGivingState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGivingConfigThunk.pending, (state, action) => {
        state.configLoading = true;
        state.configError = null;
        state.configChurchId = action.meta.arg;
      })
      .addCase(fetchGivingConfigThunk.fulfilled, (state, action) => {
        state.configLoading = false;
        state.config = action.payload.data;
        state.configChurchId = action.payload.churchId;
        state.configLastFetchedAt = action.payload.lastFetchedAt;
        state.configError = null;
      })
      .addCase(fetchGivingConfigThunk.rejected, (state, action) => {
        state.configLoading = false;
        state.configError = action.payload?.message ?? 'Unable to load giving options.';
      })
      .addCase(createGivingThunk.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
        state.paymentResult = null;
      })
      .addCase(createGivingThunk.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = null;
        state.paymentResult = action.payload;
      })
      .addCase(createGivingThunk.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload?.message ?? 'Unable to initiate giving payment.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearGivingConfigStatus, clearGivingPaymentStatus, clearGivingState } = givingSlice.actions;
export const givingReducer = givingSlice.reducer;
