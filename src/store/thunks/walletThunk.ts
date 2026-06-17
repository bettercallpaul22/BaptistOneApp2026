import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { walletService } from '@/services/wallet/walletService';
import type { RootState } from '@/store/rootReducer';
import type {
  CreateWalletPayload,
  CreateWalletResponse,
  FundWalletPayload,
  FundWalletResponse,
  WalletListResponse,
  WalletTransactionsQuery,
  WalletTransactionsResponse,
} from '@/types/wallet';

interface FundWalletThunkPayload {
  walletNumber: string;
  payload: FundWalletPayload;
}

interface FetchWalletTransactionsThunkPayload {
  walletNumber: string;
  query: WalletTransactionsQuery;
}

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

export const fundWalletThunk = createAsyncThunk<
  FundWalletResponse,
  FundWalletThunkPayload,
  { rejectValue: ReturnType<typeof toApiError>; state: RootState }
>(
  'wallet/fundWallet',
  async ({ walletNumber, payload }, { rejectWithValue }) => {
    try {
      return await walletService.fundWallet(walletNumber, payload);
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { fundingLoading } = getState().wallet;
      return !fundingLoading;
    },
  },
);

export const fetchWalletTransactionsThunk = createAsyncThunk<
  WalletTransactionsResponse,
  FetchWalletTransactionsThunkPayload,
  { rejectValue: ReturnType<typeof toApiError>; state: RootState }
>(
  'wallet/fetchWalletTransactions',
  async ({ walletNumber, query }, { rejectWithValue }) => {
    try {
      return await walletService.getWalletTransactions(walletNumber, query);
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { transactionsLoading } = getState().wallet;
      return !transactionsLoading;
    },
  },
);

export const setWalletPinThunk = createAsyncThunk<
  { status: boolean; message: string },
  { authKey: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('wallet/setWalletPin', async ({ authKey }, { rejectWithValue }) => {
  try {
    const response = await walletService.setWalletPin(authKey);

    if (!response.status) {
      return rejectWithValue(toApiError(new Error(response.message || 'Failed to set wallet PIN.')));
    }

    return { status: response.status, message: response.message ?? 'PIN set successfully.' };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const verifyWalletPinThunk = createAsyncThunk<
  { status: boolean; message: string },
  { authKey: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('wallet/verifyWalletPin', async ({ authKey }, { rejectWithValue }) => {
  try {
    const response = await walletService.verifyWalletPin(authKey);

    if (!response.status) {
      return rejectWithValue(toApiError(new Error(response.message || 'Failed to verify wallet PIN.')));
    }

    return { status: response.status, message: response.message ?? 'PIN verified successfully.' };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
