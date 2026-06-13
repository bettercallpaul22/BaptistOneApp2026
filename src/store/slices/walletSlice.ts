import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { createWalletThunk, fetchWalletsThunk } from '@/store/thunks/walletThunk';
import type { Wallet, WalletCreateCurrency } from '@/types/wallet';

interface WalletState {
  items: Wallet[];
  selectedCurrency: WalletCreateCurrency;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
  createSuccessMessage: string | null;
  lastFetchedAt: string | null;
}

const initialState: WalletState = {
  items: [],
  selectedCurrency: 'NGN',
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  createSuccessMessage: null,
  lastFetchedAt: null,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletCurrency: (state, action: PayloadAction<WalletCreateCurrency>) => {
      state.selectedCurrency = action.payload;
      state.createError = null;
      state.createSuccessMessage = null;
    },
    clearWalletError: (state) => {
      state.error = null;
    },
    clearCreateWalletStatus: (state) => {
      state.createError = null;
      state.createSuccessMessage = null;
    },
    clearWalletState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.lastFetchedAt = action.payload.lastFetchedAt;
        state.error = null;
      })
      .addCase(fetchWalletsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? 'Unable to load wallet.';
      })
      .addCase(createWalletThunk.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccessMessage = null;
      })
      .addCase(createWalletThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        state.createSuccessMessage = action.payload.message || 'Wallet created successfully.';
        state.items = [action.payload.data, ...state.items.filter((wallet) => wallet.id !== action.payload.data.id)];
      })
      .addCase(createWalletThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload?.message ?? 'Unable to create wallet.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  clearCreateWalletStatus,
  clearWalletError,
  clearWalletState,
  setWalletCurrency,
} = walletSlice.actions;
export const walletReducer = walletSlice.reducer;
