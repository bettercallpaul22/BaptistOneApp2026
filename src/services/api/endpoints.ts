export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
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
