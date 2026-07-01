import { createSlice } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { createGivingThunk, fetchGivingConfigThunk, fetchGivingHistoryThunk } from '@/store/thunks/givingThunk';
import type { CreateGivingResponse, GivingConfig, GivingHistoryItem } from '@/types/giving';

interface GivingState {
  config: GivingConfig | null;
  configChurchId: string | null;
  configLoading: boolean;
  configError: string | null;
  configLastFetchedAt: string | null;
  paymentLoading: boolean;
  paymentError: string | null;
  paymentResult: CreateGivingResponse | null;
  historyItems: GivingHistoryItem[];
  historyLoading: boolean;
  historyLoadingMore: boolean;
  historyError: string | null;
  historyTotal: number;
  historyLimit: number;
  historyOffset: number;
  historyHasMore: boolean;
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
  historyItems: [],
  historyLoading: false,
  historyLoadingMore: false,
  historyError: null,
  historyTotal: 0,
  historyLimit: 20,
  historyOffset: 0,
  historyHasMore: false,
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
      .addCase(fetchGivingHistoryThunk.pending, (state, action) => {
        const isLoadMore = (action.meta.arg.offset ?? 0) > 0;
        if (isLoadMore) {
          state.historyLoadingMore = true;
        } else {
          state.historyLoading = true;
        }
        state.historyError = null;
      })
      .addCase(fetchGivingHistoryThunk.fulfilled, (state, action) => {
        const { items, total, limit, offset } = action.payload.data;
        const isLoadMore = (offset ?? 0) > 0;
        if (isLoadMore) {
          state.historyItems = [...state.historyItems, ...items];
          state.historyLoadingMore = false;
        } else {
          state.historyItems = items;
          state.historyLoading = false;
        }
        state.historyTotal = total;
        state.historyLimit = limit;
        state.historyOffset = offset;
        state.historyHasMore = state.historyItems.length < total;
      })
      .addCase(fetchGivingHistoryThunk.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyLoadingMore = false;
        state.historyError = action.payload?.message ?? 'Unable to load giving history.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearGivingConfigStatus, clearGivingPaymentStatus, clearGivingState } = givingSlice.actions;
export const givingReducer = givingSlice.reducer;
