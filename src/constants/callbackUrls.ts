import { paths } from '@/routes/paths';

const getRuntimeOrigin = () => {
  if (typeof window === 'undefined') return '';

  return window.location.origin;
};

export const callbackUrls = {
  walletFunding: () => `${getRuntimeOrigin()}${paths.walletFundingCallback}`,
} as const;
