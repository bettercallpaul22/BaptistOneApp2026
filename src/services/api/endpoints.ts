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
    resetPassword: '/auth/reset-password',
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
    connectOptions: ({ search = '', page = 1, limit = 20 }: { search?: string; page?: number; limit?: number } = {}) => {
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
    revokeMembershipRequest: (requestId: string) => `/private/members/membership-requests/${requestId}/revoke`,
    profileCompletion: '/private/members/profile-completion',
    profileCompletionSection: (sectionKey: string) => `/private/members/profile-completion/sections/${sectionKey}`,
  },
} as const;
