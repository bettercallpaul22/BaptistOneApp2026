import { apiClient } from '@/services/api/axios';
import { endpoints } from '@/services/api/endpoints';

export interface LatestUpdate {
  id: string;
  title: string;
  summary: string;
  date: string;
}

export const homeService = {
  getUpdates: async () => {
    const { data } = await apiClient.get<LatestUpdate[]>(endpoints.home.updates);
    return data;
  },
};
