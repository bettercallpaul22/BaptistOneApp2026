import { env } from '@/config/env';
import { paths } from '@/routes/paths';

const getRuntimeOrigin = () => {
  if (typeof window === 'undefined') return '';

  return window.location.origin;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const addLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildCallbackUrl = (pathOrUrl: string) => {
  const value = pathOrUrl.trim();

  if (isAbsoluteUrl(value)) return value;

  return `${trimTrailingSlash(getRuntimeOrigin())}${addLeadingSlash(value)}`;
};

export const callbackUrls = {
  registerVerification: () => buildCallbackUrl(env.registerRedirectPath || paths.registerVerification),
  walletFunding: () => buildCallbackUrl(env.walletRedirectPath || paths.walletFundingCallback),
  giving: () => buildCallbackUrl(paths.givingCallback),
} as const;
