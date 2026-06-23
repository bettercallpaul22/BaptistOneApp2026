import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ApiResponse } from '@/types/api';
import type {
  CreateWalletPayload,
  CreateWalletResponse,
  FundWalletPayload,
  FundWalletResponse,
  WalletListResponse,
  WalletTransactionsQuery,
  WalletTransactionsResponse,
} from '@/types/wallet';

export const walletService = {
  getWallets: async () => {
    const response = await http.get<WalletListResponse>(endpoints.privateWallets.wallets);

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error(response.message || 'Unable to load wallet.');
    }

    return response;
  },

  createWallet: async (payload: CreateWalletPayload) => {
    const response = await http.post<CreateWalletResponse, CreateWalletPayload>(endpoints.privateWallets.wallets, payload);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to create wallet.');
    }

    return response;
  },

  fundWallet: async (walletNumber: string, payload: FundWalletPayload) => {
    const response = await http.post<FundWalletResponse, FundWalletPayload>(
      endpoints.privateWallets.fund(walletNumber),
      payload,
    );

    if (!response.status || !response.data?.checkoutUrl) {
      throw new Error(response.message || 'Unable to initiate wallet funding.');
    }

    return response;
  },

  getWalletTransactions: async (walletNumber: string, query: WalletTransactionsQuery) => {
    const response = await http.get<WalletTransactionsResponse>(endpoints.privateWallets.transactions(walletNumber, query));

    if (!response.status || !response.data || !Array.isArray(response.data.items)) {
      throw new Error(response.message || 'Unable to load wallet transactions.');
    }

    return response;
  },

  setWalletPin: async (authKey: string) => {
    return http.put<ApiResponse<{ status: boolean; message: string }>, { authKey: string }>(
      '/private/wallets/auth',
      { authKey },
    );
  },

  verifyWalletPin: async (authKey: string) => {
    return http.post<ApiResponse<{ status: boolean; message: string }>, { authKey: string }>(
      '/private/wallets/auth/verify',
      { authKey },
    );
  },

  verifyFundTransaction: async (walletNumber: string, transactionId: string) => {
    const response = await http.get<ApiResponse<unknown>>(
      endpoints.privateWallets.fundVerify(walletNumber, transactionId),
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to verify transaction.');
    }

    return response;
  },
};
