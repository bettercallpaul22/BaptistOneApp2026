import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { MemberAccountResponse, MemberBasicProfileUpdateRequest } from '@/types/member';

export const memberService = {
  getMemberAccount: async () => {
    const response = await http.get<MemberAccountResponse>(endpoints.privateMembers.account);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load member account.');
    }

    return response;
  },

  updateBasicProfile: async (payload: MemberBasicProfileUpdateRequest) => {
    const response = await http.put<MemberAccountResponse>(endpoints.privateMembers.basicProfile, payload);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to update basic profile.');
    }

    return response;
  },
};
