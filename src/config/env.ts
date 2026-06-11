const required = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key];

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  appName: required('VITE_APP_NAME'),
  appVersion: required('VITE_APP_VERSION'),
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
