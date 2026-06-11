import { buildAuthQuery } from '@/config/auth';

export const endpoints = {
  auth: {
    login: `/auth/sign-in?${buildAuthQuery()}`,
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
  home: {
    updates: '/home/updates',
    stats: '/home/stats',
  },
} as const;
