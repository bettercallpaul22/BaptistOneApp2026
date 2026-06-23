import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { CartItemsResponse, ResourceFulfilmentType, ResourcesResponse } from '@/types/resource';

interface AddToCartResponse {
  status: boolean;
  message?: string;
  data?: unknown;
}

interface RemoveFromCartResponse {
  status: boolean;
  message?: string;
}

export interface CheckoutPayload {
  paymentMethod: 'wallet' | 'paystack';
  authKey?: string;
  callbackUrl?: string;
  cartItems: Array<{
    resourceItemId: string;
    fulfilmentType: ResourceFulfilmentType;
    quantity: number;
  }>;
}

export interface WalletTransfer {
  debitTransactionId: string;
  creditTransactionId: string;
  memberWalletId: string;
  churchWalletId: string;
  debitedAmount: number;
  memberWalletBalanceBefore: number;
  memberWalletBalanceAfter: number;
  churchWalletBalanceBefore: number;
  churchWalletBalanceAfter: number;
}

export interface CheckoutResponse {
  status: boolean;
  message?: string;
  data?: {
    status: string;
    orderId?: string;
    reference: string;
    checkoutUrl?: string;
    pickupCode?: string;
    totalAmount: number;
    currency: string;
    walletTransfer?: WalletTransfer;
  };
}

export const resourceService = {
  getResources: async ({ search, page = 1, limit = 25 }: { search?: string; page?: number; limit?: number } = {}) => {
    const response = await http.get<ResourcesResponse>(
      endpoints.privateMembers.resources({ search, page, limit }),
    );

    if (!response.status) {
      throw new Error('Unable to load resources.');
    }

    return response;
  },

  getCart: async ({ page = 1, limit = 25 }: { page?: number; limit?: number } = {}) => {
    const response = await http.get<CartItemsResponse>(
      endpoints.privateMembers.resourceCart.list({ page, limit }),
    );

    if (!response.status) {
      throw new Error('Unable to load cart.');
    }

    return response;
  },

  addToCart: async (payload: {
    resourceItemId: string;
    fulfilmentType: ResourceFulfilmentType;
    quantity: number;
  }) => {
    const response = await http.post<AddToCartResponse>(
      endpoints.privateMembers.resourceCart.items,
      payload,
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to add item to cart.');
    }

    return response;
  },

  removeFromCart: async (cartId: string) => {
    const response = await http.delete<RemoveFromCartResponse>(
      endpoints.privateMembers.resourceCart.remove(cartId),
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to remove item from cart.');
    }

    return response;
  },

  checkout: async (payload: CheckoutPayload) => {
    const response = await http.post<CheckoutResponse>(
      endpoints.privateMembers.resourceCart.checkout,
      payload,
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to process checkout.');
    }

    return response;
  },
};
