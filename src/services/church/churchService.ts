import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type {
  ChurchDocumentsApiResponse,
  ChurchDocumentsResponse,
  ChurchEventsApiResponse,
  ChurchEventsResponse,
  ChurchLeadershipApiResponse,
  ChurchLeadershipResponse,
  ChurchPaginatedMeta,
  ChurchPastorsApiResponse,
  ChurchPastorsResponse,
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

type NormalizablePaginatedResponse = {
  status?: boolean;
  message?: string;
  data?: {
    items?: unknown;
    meta?: unknown;
  };
  items?: unknown;
  meta?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeInteger = (value: unknown, fallback: number) => {
  const numberValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numberValue) ? Math.max(0, Math.trunc(numberValue)) : fallback;
};

const normalizePaginatedMeta = (meta: unknown, itemsLength: number): ChurchPaginatedMeta => {
  const metaRecord = isRecord(meta) ? meta : {};
  const page = normalizeInteger(metaRecord.page, 1);
  const limit = normalizeInteger(metaRecord.limit, itemsLength || 1);
  const total = normalizeInteger(metaRecord.total, itemsLength);
  const calculatedTotalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const totalPages = normalizeInteger(metaRecord.totalPages, calculatedTotalPages);

  return { page, limit, total, totalPages };
};

const normalizePaginatedResponse = <TResponse extends { items: unknown[]; meta: ChurchPaginatedMeta }>(
  response: NormalizablePaginatedResponse,
  fallbackMessage: string,
) => {
  const data = response.data ?? response;

  if (response.status === false) {
    throw new Error(response.message || fallbackMessage);
  }

  if (!Array.isArray(data.items) || !data.meta) {
    throw new Error(response.message || fallbackMessage);
  }

  return {
    ...data,
    items: data.items,
    meta: normalizePaginatedMeta(data.meta, data.items.length),
  } as TResponse;
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

  getPastors: async (churchId: string, { page = 1, limit = 25 }: { page?: number; limit?: number } = {}) => {
    const response = await http.get<ChurchPastorsApiResponse>(
      endpoints.publicPastors.list({ churchId, page, limit }),
    );

    return normalizePaginatedResponse<ChurchPastorsResponse>(response, 'Unable to load church pastors.');
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
