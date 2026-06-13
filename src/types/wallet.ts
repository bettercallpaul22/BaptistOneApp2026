import type { TransactionVerification } from '@/types/transaction';

export type WalletCreateCurrency = 'NGN' | 'USD';
export type WalletFundingPaymentMethod = 'paystack';
export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionChannel = 'dedicated-nuban' | 'purchase' | 'withdrawal' | 'fee' | 'transfer';
export type WalletTransactionStatus = 'pending' | 'success' | 'failed';

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

export interface FundWalletPayload {
  amount: number;
  paymentMethod: WalletFundingPaymentMethod;
  currency: string;
  callbackUrl: string;
}

export interface WalletFundingData {
  transaction: TransactionVerification;
  checkoutUrl: string;
  walletId: string;
  fundingAmount: number;
}

export interface FundWalletResponse {
  status: boolean;
  message?: string;
  data: WalletFundingData;
}

export interface WalletTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: WalletTransactionType | string;
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  channel: WalletTransactionChannel | string;
  status: WalletTransactionStatus | string;
  reference: string;
  requestRef: string | null;
  providerRef: string | null;
  meta: Record<string, unknown>;
  walletId: string;
  walletBucketId: string | null;
  walletAccountId: string | null;
}

export interface WalletTransactionsQuery {
  currPage?: number;
  perPage?: number;
  type?: WalletTransactionType | '';
  channel?: WalletTransactionChannel | '';
  status?: WalletTransactionStatus | '';
}

export interface WalletTransactionsPage {
  items: WalletTransaction[];
  currPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface WalletTransactionsResponse {
  status: boolean;
  message?: string;
  data: WalletTransactionsPage;
}
