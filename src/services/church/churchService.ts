import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ChurchRegistrationOptionsResponse,
  FetchChurchRegistrationOptionsPayload,
  OnboardMemberPayload,
  OnboardMemberResponse,
  PublicChurchDetailsResponse,
  RevokeMembershipRequestPayload,
  RevokeMembershipRequestResponse,
} from '@/types/church';

export const churchService = {
  getChurch: async (id: string) => {
    const response = await http.get<PublicChurchDetailsResponse>(endpoints.publicChurches.detail(id));

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load church details.');
    }

    return response;
  },

  getRegistrationOptions: async ({ search = '', page = 1, limit = 20 }: FetchChurchRegistrationOptionsPayload = {}) => {
    const response = await http.get<ChurchRegistrationOptionsResponse>(
      endpoints.publicChurches.connectOptions({ search, page, limit }),
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load churches.');
    }

    return response;
  },

  onboardMember: async (payload: OnboardMemberPayload) => {
    const response = await http.post<OnboardMemberResponse, OnboardMemberPayload>(endpoints.privateMembers.onboard, payload);

    if (!response.status) {
      throw new Error(response.message || 'Unable to send join request.');
    }

    return response;
  },

  revokeMembershipRequest: async ({ requestId }: RevokeMembershipRequestPayload) => {
    const response = await http.post<RevokeMembershipRequestResponse>(
      endpoints.privateMembers.revokeMembershipRequest(requestId),
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to revoke church request.');
    }

    return response;
  },
};
