import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ChurchMinistriesResponse, MyMinistryResponse } from '@/types/ministry';

interface MinistryJoinResponse {
  status: boolean;
  message?: string;
}

export const ministryService = {
  getMyMinistries: async () => {
    const response = await http.get<MyMinistryResponse>(endpoints.privateMembers.myMinistries);

    if (!response.status) {
      throw new Error(response.message || 'Unable to load your ministries.');
    }

    return response;
  },

  getChurchMinistries: async () => {
    const response = await http.get<ChurchMinistriesResponse>(endpoints.privateMembers.churchMinistries);

    if (!response.status) {
      throw new Error(response.message || 'Unable to load church ministries.');
    }

    return response;
  },

  requestToJoinMinistry: async (ministryId: string) => {
    const response = await http.post<MinistryJoinResponse>(endpoints.privateMembers.requestToJoinMinistry(ministryId));

    if (!response.status) {
      throw new Error(response.message || 'Unable to send join request.');
    }

    return response;
  },

  cancelMinistryRequest: async (requestId: string) => {
    const response = await http.post<MinistryJoinResponse>(endpoints.privateMembers.cancelMinistryRequest(requestId));

    if (!response.status) {
      throw new Error(response.message || 'Unable to cancel request.');
    }

    return response;
  },
};
