import { storageKeys } from '@/constants/storage';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(storageKeys.accessToken),
  getRefreshToken: () => localStorage.getItem(storageKeys.refreshToken),
  setAccessToken: (accessToken: string | null) => {
    if (accessToken) {
      localStorage.setItem(storageKeys.accessToken, accessToken);
      return;
    }

    localStorage.removeItem(storageKeys.accessToken);
  },
  setSession: (accessToken: string, refreshToken?: string | null) => {
    localStorage.setItem(storageKeys.accessToken, accessToken);

    if (refreshToken) {
      localStorage.setItem(storageKeys.refreshToken, refreshToken);
      return;
    }

    localStorage.removeItem(storageKeys.refreshToken);
  },
  clear: () => {
    localStorage.removeItem(storageKeys.accessToken);
    localStorage.removeItem(storageKeys.refreshToken);
  },
};
