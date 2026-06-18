import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { ChurchMinistriesResponse, MyMinistryResponse } from '@/types/ministry';

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
};
