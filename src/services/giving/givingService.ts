import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { CreateGivingPayload, CreateGivingResponse, GivingConfigResponse, GivingHistoryResponse } from '@/types/giving';

export const givingService = {
  getConfig: async (churchId: string) => {
    const response = await http.get<GivingConfigResponse>(endpoints.publicGiving.config(churchId));

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load giving options.');
    }

    return response;
  },

  createGiving: async (payload: CreateGivingPayload) => {
    const response = await http.post<CreateGivingResponse, CreateGivingPayload>(
      endpoints.publicGiving.create,
      payload,
    );

    if (!response.status || !response.data?.status) {
      throw new Error(response.data?.message || response.message || 'Unable to initiate giving payment.');
    }

    if (payload.paymentMethod === 'paystack' && !response.data?.data?.transaction?.checkoutUrl) {
      throw new Error('Unable to initiate giving payment.');
    }

    return response;
  },

  getHistory: async ({ limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}) => {
    const response = await http.get<GivingHistoryResponse>(endpoints.publicGiving.history({ limit, offset }));

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load giving history.');
    }

    return response;
  },
};
