export interface TransactionFee {
  name: string;
  type: string;
  amountTotal: number;
  description?: string | null;
}

export interface TransactionVerification {
  id: string;
  serialNumber: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  amountTotal: number;
  currency: string;
  fees: TransactionFee[];
  feesAmountTotal: number;
  paymentMethod: string;
  status: string;
  reference: string;
  orderId: string;
  profileId: string;
  checkoutUrl?: string | null;
  walletId?: string | null;
  meta?: Record<string, unknown>;
}

export interface TransactionVerificationResponse {
  status: boolean;
  message?: string;
  data: TransactionVerification;
}
