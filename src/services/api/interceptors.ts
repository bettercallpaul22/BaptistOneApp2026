import { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { endpoints } from './endpoints';
import { tokenStore } from './tokenStore';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
}

const publicAuthEndpoints = new Set<string>([
  endpoints.auth.login,
  endpoints.auth.register,
  endpoints.auth.refresh,
  endpoints.auth.forgotPassword,
  endpoints.auth.verifyOtp,
  endpoints.auth.resetPassword,
]);

const isEndpoint = (url: string | undefined, endpoint: string) => url === endpoint || url?.endsWith(endpoint);
const isPublicAuthRequest = (url: string | undefined) => Array.from(publicAuthEndpoints).some((endpoint) => isEndpoint(url, endpoint));

const applyAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  const headers = AxiosHeaders.from(config.headers);

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  config.headers = headers;
};

export const installInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const token = tokenStore.getAccessToken();

    if (token && !isPublicAuthRequest(config.url)) {
      applyAuthHeader(config, token);
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as RetryableRequest | undefined;
      const refreshToken = tokenStore.getRefreshToken();
      const canRefresh =
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isEndpoint(originalRequest.url, endpoints.auth.refresh) &&
        refreshToken;

      if (canRefresh) {
        originalRequest._retry = true;
        const { data } = await client.post<RefreshResponse>(endpoints.auth.refresh, { refreshToken });

        tokenStore.setAccessToken(data.accessToken);
        applyAuthHeader(originalRequest, data.accessToken);

        return client(originalRequest);
      }

      return Promise.reject(error);
    },
  );
};
