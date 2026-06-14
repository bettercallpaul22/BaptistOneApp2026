import { endpoints } from '@/services/api/endpoints';
import { http, type ApiRequestConfig } from '@/services/api/http';
import type {
  FamilyMemberSearchResponse,
  FamilyLinkRequestsResponse,
  InviteFamilyMemberPayload,
  InviteFamilyMemberResponse,
  LinkFamilyMemberPayload,
  LinkFamilyMemberResponse,
  UserFamilyResponse,
} from '../types/familyInviteTypes';

export const familyInviteService = {
  getFamily: async () => {
    const response = await http.get<UserFamilyResponse>(endpoints.privateMembers.family);

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load family.');
    }

    return response;
  },

  searchMembers: async (q: string, config?: ApiRequestConfig) => {
    const response = await http.get<FamilyMemberSearchResponse>(
      endpoints.privateMembers.familySearch({ q, limit: 20 }),
      config,
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to search members.');
    }

    return response;
  },

  listLinkRequests: async () => {
    const response = await http.get<FamilyLinkRequestsResponse>(
      endpoints.privateMembers.familyLinkRequests,
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load family requests.');
    }

    return response;
  },

  inviteMember: async (payload: InviteFamilyMemberPayload) => {
    const response = await http.post<InviteFamilyMemberResponse, InviteFamilyMemberPayload>(
      endpoints.privateMembers.familyInvite,
      payload,
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to send invite.');
    }

    return response;
  },

  linkMember: async (payload: LinkFamilyMemberPayload) => {
    const response = await http.post<LinkFamilyMemberResponse, LinkFamilyMemberPayload>(
      endpoints.privateMembers.familyLink,
      payload,
    );

    if (!response.status) {
      throw new Error(response.message || 'Unable to link family member.');
    }

    return response;
  },
};
