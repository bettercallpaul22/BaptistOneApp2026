import { storageKeys } from '@/constants/storage';
import type { AuthData } from '@/types/auth';

export type StoredAuthStatus =
  | { status: 'authenticated'; authData: AuthData | null; accessToken: string; hasKnownUser: boolean }
  | { status: 'missing' | 'expired' | 'invalid'; authData: AuthData | null; accessToken: null; hasKnownUser: boolean };

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const decodeJwtExpiresTimestamp = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='));
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };

    return typeof parsedPayload.exp === 'number' ? parsedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const readStoredAuthData = () => parseJson<AuthData>(localStorage.getItem(storageKeys.authData));

export const hasStoredUserData = () => Boolean(readStoredAuthData() || localStorage.getItem(storageKeys.user));

export const getStoredAuthStatus = (): StoredAuthStatus => {
  const authData = readStoredAuthData();
  const hasKnownUser = Boolean(authData || localStorage.getItem(storageKeys.user));
  const accessToken = localStorage.getItem(storageKeys.accessToken);

  if (!accessToken) {
    return { status: 'missing', authData, accessToken: null, hasKnownUser };
  }

  const expiresTimestamp = authData?.access.expiresTimestamp ?? decodeJwtExpiresTimestamp(accessToken);

  if (!expiresTimestamp) {
    return { status: 'invalid', authData, accessToken: null, hasKnownUser };
  }

  if (expiresTimestamp <= Date.now()) {
    return { status: 'expired', authData, accessToken: null, hasKnownUser };
  }

  return { status: 'authenticated', authData, accessToken, hasKnownUser };
};
