import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { walletService } from '@/services/wallet/walletService';
import type { RootState } from '@/store/rootReducer';
import type { CreateWalletPayload, CreateWalletResponse, WalletListResponse } from '@/types/wallet';

export const fetchWalletsThunk = createAsyncThunk<
  WalletListResponse & { lastFetchedAt: string },
  void,
  { rejectValue: ReturnType<typeof toApiError>; state: RootState }
>(
  'wallet/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletService.getWallets();

      return {
        ...response,
        lastFetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { loading } = getState().wallet;
      return !loading;
    },
  },
);

export const createWalletThunk = createAsyncThunk<
  CreateWalletResponse,
  CreateWalletPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('wallet/createWallet', async (payload, { rejectWithValue }) => {
  try {
    return await walletService.createWallet(payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
