/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_NOTIFICATIONS_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
  readonly VITE_REGISTER_REDIRECT_PATH?: string;
  readonly VITE_WALLET_REDIRECT_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
