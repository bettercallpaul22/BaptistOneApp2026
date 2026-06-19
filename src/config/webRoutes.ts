import { env } from './env';

export const webTabPaths = {
  Home: '/home',
  Bible: '/bible',
  Hymnal: '/hymnal',
  Church: '/church',
  Profile: '/profile',
} as const;

export type WebTabName = keyof typeof webTabPaths;

export const baseWebUrl = env.webviewUrl;

const joinUrl = (baseUrl: string, path: string) => {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}?nativeShell=1`;
};

export const getTabWebUrl = (tabName: WebTabName) => joinUrl(baseWebUrl, webTabPaths[tabName]);
