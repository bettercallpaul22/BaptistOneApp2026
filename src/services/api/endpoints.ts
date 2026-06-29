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
    access: '/auth/access',
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
    basicProfile: '/private/members/basic-profile',
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
    cancelDepartmentRequest: (requestId: string) =>
      `/private/members/my/department-requests/${requestId}/cancel`,
    departmentMembers: (departmentId: string) =>
      `/public/departments/departments/${encodeURIComponent(departmentId)}/members`,
    addDepartmentMember: (departmentId: string) =>
      `/private/members/my/departments/${encodeURIComponent(departmentId)}/members`,
    churchMembers: (churchId: string) =>
      `/public/members/church/${encodeURIComponent(churchId)}/members`,
    myUnits: '/private/members/my/units',
    joinUnit: (unitId: string) =>
      `/private/members/my/units/${encodeURIComponent(unitId)}/request`,
    unitRequests: '/private/members/my/unit-requests',
    cancelUnitRequest: (requestId: string) =>
      `/private/members/my/unit-requests/${requestId}/cancel`,
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
    resources: ({ search, page = 1, limit = 25 }: { search?: string; page?: number; limit?: number } = {}) => {
      const params = new URLSearchParams();
      const q = search?.trim();
      if (q) params.set('search', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/private/member/resources?${params.toString()}`;
    },
    resourceCart: {
      items: '/private/member/resources/cart/items',
      list: ({ page = 1, limit = 25 }: { page?: number; limit?: number } = {}) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        return `/private/member/resources/cart?${params.toString()}`;
      },
      remove: (cartId: string) =>
        `/private/member/resources/cart/items/${encodeURIComponent(cartId)}`,
      checkout: '/private/member/resources/checkout',
    },
  },
  privateWallets: {
    wallets: '/private/wallets',
    authVerify: '/private/wallets/auth/verify',
    fund: (walletNumber: string) => `/private/wallets/${encodeURIComponent(walletNumber)}/fund`,
    fundVerify: (walletNumber: string, transactionId: string) =>
      `/private/wallets/${encodeURIComponent(walletNumber)}/fund/${encodeURIComponent(transactionId)}/verify`,
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
  publicConventions: {
    programs: (id: string, { page = 1, limit = 25, search }: { page?: number; limit?: number; search?: string } = {}) => {
      const params = new URLSearchParams();
      const q = search?.trim();
      if (q) params.set('search', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/public/conventions/${encodeURIComponent(id)}/programs?${params.toString()}`;
    },
    publications: (id: string, { page = 1, limit = 25, search }: { page?: number; limit?: number; search?: string } = {}) => {
      const params = new URLSearchParams();
      const q = search?.trim();
      if (q) params.set('search', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/public/conventions/${encodeURIComponent(id)}/publications?${params.toString()}`;
    },
    announcements: (id: string, { page = 1, limit = 25, search }: { page?: number; limit?: number; search?: string } = {}) => {
      const params = new URLSearchParams();
      params.set('type', 'ANNOUNCEMENT');
      const q = search?.trim();
      if (q) params.set('search', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/public/conventions/${encodeURIComponent(id)}/broadcasts?${params.toString()}`;
    },
  },
  privateConventions: {
    documents: (id: string, { page = 1, limit = 25, search }: { page?: number; limit?: number; search?: string } = {}) => {
      const params = new URLSearchParams();
      const q = search?.trim();
      if (q) params.set('search', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      return `/private/conventions/${encodeURIComponent(id)}/documents?${params.toString()}`;
    },
    registerProgram: (conventionId: string, programId: string) =>
      `/private/member/conventions/${encodeURIComponent(conventionId)}/programs/${encodeURIComponent(programId)}/register`,
    registrations: (conventionId: string) =>
      `/private/member/conventions/${encodeURIComponent(conventionId)}/registrations`,
    purchasePublication: (conventionId: string, publicationId: string) =>
      `/private/member/conventions/${encodeURIComponent(conventionId)}/publications/${encodeURIComponent(publicationId)}/purchase`,
    publicationAccesses: (conventionId: string) =>
      `/private/member/conventions/${encodeURIComponent(conventionId)}/publications/accesses`,
  },
} as const;
