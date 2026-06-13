export type WalletCreateCurrency = 'NGN' | 'USD';

export interface Wallet {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  walletNumber: string;
  status: string;
  currency: string;
  resourceId: string;
  resourceType: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export interface WalletListResponse {
  status: boolean;
  message?: string;
  data: Wallet[];
}

export interface CreateWalletPayload {
  currency: WalletCreateCurrency;
}

export interface CreateWalletResponse {
  status: boolean;
  message?: string;
  data: Wallet;
}
