import { buildAuthQuery } from '@/config/auth';

export const endpoints = {
  auth: {
    login: `/auth/sign-in?${buildAuthQuery()}`,
    intent: `/auth/intent?${buildAuthQuery()}`,
    handoffLogin: '/api/auth/handoff/login',
    register: `/auth/sign-up?${buildAuthQuery(true)}`,
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    verifyOtp: '/auth/verify-otp',
    setPassword: '/auth/set-password',
    me: '/auth/me',
    switchAccess: '/auth/access/switch',
  },
  user: {
    profile: '/user/profile',
  },
  files: {
    upload: '/files/upload',
  },
  home: {
    updates: '/home/updates',
    stats: '/home/stats',
  },
  publicChurches: {
    detail: (id: string) => `/public/churches/${encodeURIComponent(id)}`,
    registrationReview: (token: string) =>
      `/public/churches/registration-reviews/${encodeURIComponent(token)}`,
    registrationReviewApprove: (token: string) =>
      `/public/churches/registration-reviews/${encodeURIComponent(token)}/approve`,
    registrationReviewReject: (token: string) =>
      `/public/churches/registration-reviews/${encodeURIComponent(token)}/reject`,
    connectOptions: ({
      search = '',
      page = 1,
      limit = 20,
    }: { search?: string; page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();
      const query = search.trim();

      if (query) {
        params.set('search', query);
      }

      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/public/churches/connect-options?${params.toString()}`;
    },
  },
  publicPastors: {
    list: ({ churchId, page = 1, limit = 25 }: { churchId?: string; page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();

      if (churchId) {
        params.set('churchId', churchId);
      }

      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/public/pastors?${params.toString()}`;
    },
  },
  churches: {
    leadership: ({ churchId, page = 1, limit = 20 }: { churchId: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/churches/${encodeURIComponent(churchId)}/leadership?${params.toString()}`;
    },
  },
  privateChurches: {
    documents: ({ churchId, page = 1, limit = 25 }: { churchId: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/private/churches/${encodeURIComponent(churchId)}/documents?${params.toString()}`;
    },
    events: ({ churchId, page = 1, limit = 25 }: { churchId: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/private/churches/${encodeURIComponent(churchId)}/events?${params.toString()}`;
    },
  },
  privateMembers: {
    account: '/private/members/account',
    onboard: '/private/members/onboard',
    churchContent: (type: string, { page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();

      params.set('type', type);
      params.set('page', String(page));
      params.set('limit', String(limit));

      return `/private/member/church-content?${params.toString()}`;
    },
    revokeMembershipRequest: (requestId: string) =>
      `/private/members/membership-requests/${requestId}/revoke`,
    familySearch: ({ q, limit = 20 }: { q: string; limit?: number }) => {
      const params = new URLSearchParams();

      params.set('q', q.trim());
      params.set('limit', String(limit));

      return `/private/members/family/search?${params.toString()}`;
    },
    familyInvite: '/private/members/family/invite',
    familyInvitationAccept: (id: string) =>
      `/private/members/family/invitations/${encodeURIComponent(id)}/accept`,
    familyInvitationReject: (id: string) =>
      `/private/members/family/invitations/${encodeURIComponent(id)}/reject`,
    familyLink: '/private/members/family/link',
    familyLinkRequests: '/private/members/family/link-requests',
    family: '/private/members/family',
    familyLeave: '/private/members/family/leave',
    profileCompletion: '/private/members/profile-completion',
    profileCompletionSection: (sectionKey: string) =>
      `/private/members/profile-completion/sections/${sectionKey}`,
    myDepartments: '/private/members/my/departments',
    churchDepartments: '/private/members/my/church/departments',
    joinDepartment: (departmentId: string) =>
      `/private/members/my/departments/${encodeURIComponent(departmentId)}/request`,
    departmentRequests: '/private/members/my/department-requests',
    myUnits: '/private/members/my/units',
    myMinistries: '/private/members/my/ministries',
    churchMinistries: '/private/members/my/church/ministries',
    requestToJoinMinistry: (ministryId: string) =>
      `/private/members/my/ministries/${ministryId}/request`,
    cancelMinistryRequest: (requestId: string) =>
      `/private/members/my/ministry-requests/${requestId}/cancel`,
    forums: ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/private/member/forums?${params.toString()}`;
    },
  },
  privateWallets: {
    wallets: '/private/wallets',
    authVerify: '/private/wallets/auth/verify',
    fund: (walletNumber: string) => `/private/wallets/${encodeURIComponent(walletNumber)}/fund`,
    transactions: (
      walletNumber: string,
      {
        channel,
        currPage = 1,
        perPage = 10,
        status,
        type,
      }: {
        currPage?: number;
        perPage?: number;
        type?: string;
        channel?: string;
        status?: string;
      } = {},
    ) => {
      const params = new URLSearchParams();

      params.set('currPage', String(currPage));
      params.set('perPage', String(perPage));
      if (type) params.set('type', type);
      if (channel) params.set('channel', channel);
      if (status) params.set('status', status);

      return `/private/wallets/${encodeURIComponent(walletNumber)}/transactions?${params.toString()}`;
    },
  },
  publicTransactions: {
    verify: (reference: string) => `/public/transactions/${encodeURIComponent(reference)}/verify`,
  },
  publicGiving: {
    config: (churchId: string) => `/public/giving/config/${encodeURIComponent(churchId)}`,
    create: '/private/giving',
  },
} as const;
