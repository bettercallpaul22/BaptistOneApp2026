import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import { createWalletThunk, fetchWalletsThunk, fetchWalletTransactionsThunk, fundWalletThunk } from '@/store/thunks/walletThunk';
import type { FundWalletResponse, Wallet, WalletCreateCurrency, WalletTransactionsResponse } from '@/types/wallet';

interface WalletState {
  items: Wallet[];
  selectedCurrency: WalletCreateCurrency;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
  createSuccessMessage: string | null;
  fundingLoading: boolean;
  fundingError: string | null;
  fundingResult: FundWalletResponse | null;
  transactionsLoading: boolean;
  transactionsError: string | null;
  transactionsResult: WalletTransactionsResponse | null;
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
  fundingLoading: false,
  fundingError: null,
  fundingResult: null,
  transactionsLoading: false,
  transactionsError: null,
  transactionsResult: null,
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
    clearWalletFundingStatus: (state) => {
      state.fundingLoading = false;
      state.fundingError = null;
      state.fundingResult = null;
    },
    clearWalletTransactionsStatus: (state) => {
      state.transactionsLoading = false;
      state.transactionsError = null;
      state.transactionsResult = null;
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
      .addCase(fundWalletThunk.pending, (state) => {
        state.fundingLoading = true;
        state.fundingError = null;
        state.fundingResult = null;
      })
      .addCase(fundWalletThunk.fulfilled, (state, action) => {
        state.fundingLoading = false;
        state.fundingError = null;
        state.fundingResult = action.payload;
      })
      .addCase(fundWalletThunk.rejected, (state, action) => {
        state.fundingLoading = false;
        state.fundingError = action.payload?.message ?? 'Unable to initiate wallet funding.';
      })
      .addCase(fetchWalletTransactionsThunk.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(fetchWalletTransactionsThunk.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = null;
        state.transactionsResult = action.payload;
      })
      .addCase(fetchWalletTransactionsThunk.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload?.message ?? 'Unable to load wallet transactions.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  clearCreateWalletStatus,
  clearWalletFundingStatus,
  clearWalletError,
  clearWalletTransactionsStatus,
  clearWalletState,
  setWalletCurrency,
} = walletSlice.actions;
export const walletReducer = walletSlice.reducer;
