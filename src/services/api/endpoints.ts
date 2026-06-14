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
  privateMembers: {
    account: '/private/members/account',
    onboard: '/private/members/onboard',
    revokeMembershipRequest: (requestId: string) =>
      `/private/members/membership-requests/${requestId}/revoke`,
    familySearch: ({ q, limit = 20 }: { q: string; limit?: number }) => {
      const params = new URLSearchParams();

      params.set('q', q.trim());
      params.set('limit', String(limit));

      return `/private/members/family/search?${params.toString()}`;
    },
    familyInvite: '/private/members/family/invite',
    familyLink: '/private/members/family/link',
    familyLinkRequests: '/private/members/family/link-requests',
    family: '/private/members/family',
    profileCompletion: '/private/members/profile-completion',
    profileCompletionSection: (sectionKey: string) =>
      `/private/members/profile-completion/sections/${sectionKey}`,
  },
  privateWallets: {
    wallets: '/private/wallets',
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
} as const;
