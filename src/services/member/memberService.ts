import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { MemberAccountResponse } from '@/types/member';

export const memberService = {
  getMemberAccount: async () => {
    const response = await http.get<MemberAccountResponse>(endpoints.privateMembers.account);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load member account.');
    }

    return response;
  },
};
