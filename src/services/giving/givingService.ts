import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { CreateGivingPayload, CreateGivingResponse, GivingConfigResponse } from '@/types/giving';

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

    if (!response.status || !response.data?.checkoutUrl) {
      throw new Error(response.message || 'Unable to initiate giving payment.');
    }

    return response;
  },
};
