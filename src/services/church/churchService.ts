import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ChurchDocumentsApiResponse,
  ChurchDocumentsResponse,
  ChurchEventsApiResponse,
  ChurchEventsResponse,
  ChurchLeadershipApiResponse,
  ChurchLeadershipResponse,
  ChurchRegistrationReviewActionResponse,
  ChurchRegistrationReviewDetailsResponse,
  ChurchRegistrationOptionsResponse,
  FetchChurchRegistrationOptionsPayload,
  OnboardMemberPayload,
  OnboardMemberResponse,
  PublicChurchDetailsResponse,
  RevokeMembershipRequestPayload,
  RevokeMembershipRequestResponse,
} from '@/types/church';

const normalizePaginatedResponse = <TResponse extends { items: unknown[]; meta: unknown }>(
  response: {
    status?: boolean;
    message?: string;
    data?: TResponse;
    items?: unknown[];
    meta?: unknown;
  },
  fallbackMessage: string,
) => {
  const data = response.data ?? response;

  if (response.status === false) {
    throw new Error(response.message || fallbackMessage);
  }

  if (!Array.isArray(data.items) || !data.meta) {
    throw new Error(response.message || fallbackMessage);
  }

  return data as TResponse;
};

const assertRegistrationReviewResponse = (
  response: ChurchRegistrationReviewActionResponse,
  fallbackMessage: string,
) => {
  if (response.status === false || response.success === false) {
    throw new Error(response.message || fallbackMessage);
  }

  return response;
};

export const churchService = {
  getChurch: async (id: string) => {
    const response = await http.get<PublicChurchDetailsResponse>(endpoints.publicChurches.detail(id));

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load church details.');
    }

    return response;
  },

  getRegistrationReview: async (token: string) => {
    const response = await http.get<ChurchRegistrationReviewDetailsResponse>(
      endpoints.publicChurches.registrationReview(token),
    );

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Unable to load church registration review.');
    }

    return response;
  },

  getLeadership: async (churchId: string, { page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const response = await http.get<ChurchLeadershipApiResponse>(
      endpoints.churches.leadership({ churchId, page, limit }),
    );

    return normalizePaginatedResponse<ChurchLeadershipResponse>(response, 'Unable to load church leadership.');
  },

  getDocuments: async (churchId: string, { page = 1, limit = 25 }: { page?: number; limit?: number } = {}) => {
    const response = await http.get<ChurchDocumentsApiResponse>(
      endpoints.privateChurches.documents({ churchId, page, limit }),
    );

    return normalizePaginatedResponse<ChurchDocumentsResponse>(response, 'Unable to load church documents.');
  },

  getEvents: async (churchId: string, { page = 1, limit = 25 }: { page?: number; limit?: number } = {}) => {
    const response = await http.get<ChurchEventsApiResponse>(
      endpoints.privateChurches.events({ churchId, page, limit }),
    );

    return normalizePaginatedResponse<ChurchEventsResponse>(response, 'Unable to load church events.');
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

  approveRegistrationReview: async (token: string) => {
    const response = await http.post<ChurchRegistrationReviewActionResponse>(
      endpoints.publicChurches.registrationReviewApprove(token),
    );

    return assertRegistrationReviewResponse(response, 'Unable to approve church registration.');
  },

  rejectRegistrationReview: async (token: string) => {
    const response = await http.post<ChurchRegistrationReviewActionResponse>(
      endpoints.publicChurches.registrationReviewReject(token),
    );

    return assertRegistrationReviewResponse(response, 'Unable to reject church registration.');
  },
};
