import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { CreateWalletPayload, CreateWalletResponse, WalletListResponse } from '@/types/wallet';

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
};
