import type { TransactionVerification } from '@/types/transaction';

export type GivingPaymentMethod = 'paystack' | 'wallet';

export interface GivingConfigWallet {
  id: string;
  currency: string;
  walletNumber: string;
  displayName: string;
}

export interface GivingBucket {
  id: string;
  walletId: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  balance: number;
}

export interface GivingConfig {
  churchId: string;
  supportedCurrencies: string[];
  configuredCurrencies: string[];
  walletCurrencies: string[];
  wallets: GivingConfigWallet[];
  minAmount: number | null;
  maxAmount: number | null;
  buckets: GivingBucket[];
}

export interface GivingConfigResponse {
  status: boolean;
  message?: string;
  data: GivingConfig;
}

export interface CreateGivingPayload {
  churchId: string;
  amount: number;
  currency: string;
  type: string;
  paymentMethod: GivingPaymentMethod;
  bucketId: string;
  memberId: string;
  callbackUrl: string;
  note?: string;
  authKey?: string;
}

export interface GivingPaymentData {
  transaction: TransactionVerification;
  checkoutUrl: string;
  givingAmount?: number;
  amount?: number;
  walletId?: string;
  fundingAmount?: number;
  financeMeta?: Record<string, unknown>;
}

export interface CreateGivingInnerResponse {
  status: boolean;
  message?: string;
  data: GivingPaymentData;
}

export interface CreateGivingResponse {
  status: boolean;
  message?: string;
  data: CreateGivingInnerResponse;
}
