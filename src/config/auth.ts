export type AuthPlatform = 'app' | 'admin' | 'sysadmin';

export const AUTH_APP_NAME = 'baptist-one';
export const AUTH_PLATFORM: AuthPlatform = 'app';
export const AUTH_REDIRECT_URL = 'https://baptist.ng/auth/callback';

export const buildAuthQuery = (includeRedirectUrl = false) => {
  const params = new URLSearchParams({
    appName: AUTH_APP_NAME,
    platform: AUTH_PLATFORM,
  });

  if (includeRedirectUrl) {
    params.set('redirectUrl', AUTH_REDIRECT_URL);
  }

  return params.toString();
};
