import Config from 'react-native-config';

// const fallbackApiUrl = 'https://baptist-v2.dokploy.rokswood.com/';
// const fallbackWebUrl = 'https://baptist-v2.dokploy.rokswood.com/';
const fallbackApiUrl = 'https://app.baptist.ng/';
const fallbackWebUrl = 'https://app.baptist.ng/';

export const env = {
  apiBaseUrl: Config.API_BASE_URL?.trim() || fallbackApiUrl,
  webviewUrl: Config.WEBVIEW_URL?.trim() || fallbackWebUrl,
} as const;
