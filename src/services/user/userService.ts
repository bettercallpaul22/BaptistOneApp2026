import { apiClient } from '@/services/api/axios';
import { endpoints } from '@/services/api/endpoints';
import type { User } from '@/types/user';

export const userService = {
  getProfile: async () => {
    const { data } = await apiClient.get<User>(endpoints.user.profile);
    return data;
  },
};
