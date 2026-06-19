# BaptistOne Auth Documentation

This document explains how authentication should work for the BaptistOne native and web apps. The two apps share the same API contract and request pattern so auth features can be built consistently across platforms.

## API Base URL

- Native app: `API_BASE_URL` from `react-native-config`.
- Web app: `VITE_API_BASE_URL` from Vite env.
- The value should point to the backend API root, for example `https://api.example.com`.
- Do not include endpoint paths in the base URL.

## Auth Endpoints

The shared endpoint names live in `src/services/api/endpoints.ts`.

| Action | Endpoint | Method | Auth Required |
| --- | --- | --- | --- |
| Login | `/auth/login` | `POST` | No |
| Register | `/auth/register` | `POST` | No |
| Refresh token | `/auth/refresh` | `POST` | No refresh access token required, but requires a refresh token in the body |
| Forgot password | `/auth/forgot-password` | `POST` | No |
| Verify OTP | `/auth/verify-otp` | `POST` | No |
| Reset password | `/auth/reset-password` | `POST` | No |
| Current user | `/auth/me` | `GET` | Yes |

## Session Shape

Login and register should return this shape:

```ts
interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

The access token is used on protected requests:

```http
Authorization: Bearer <accessToken>
```

The refresh token is used only to request a new access token after a `401 Unauthorized` response.

## Request Client

Use the Axios client from `src/services/api/axios.ts` or the typed helper from `src/services/api/http.ts`.

```ts
import { http } from '../api/http';
import { endpoints } from '../api/endpoints';

const profile = await http.get<User>(endpoints.auth.me);
```

Add optional headers per request through the config object:

```ts
await http.post<LoginResponse, LoginPayload>(endpoints.auth.login, payload, {
  headers: {
    'X-Device-Id': deviceId,
  },
});
```

The request interceptor automatically adds `Authorization` when an access token is available. If a request already supplies an `Authorization` header, the interceptor keeps the explicit header.

## Token Storage

### Native

The native app currently exposes `tokenStore` from `src/services/api/tokenStore.ts`. It stores tokens in memory:

```ts
import { tokenStore } from '../api/tokenStore';

tokenStore.setSession({
  accessToken: session.accessToken,
  refreshToken: session.refreshToken,
});
```

Before production release, connect `tokenStore` to secure persistent storage such as Keychain on iOS and EncryptedSharedPreferences on Android. Avoid storing long-lived auth tokens in plain AsyncStorage.

### Web

The web app token store reads and writes the existing `localStorage` keys:

- `newbaptist.accessToken`
- `newbaptist.refreshToken`
- `newbaptist.user`

Clear all three values during logout.

## Login Flow

1. Send credentials to `POST /auth/login`.
2. Store `accessToken`, `refreshToken`, and `user`.
3. Update app auth state.
4. Navigate the user to the protected area.
5. Future protected API calls automatically include the bearer token.

## Refresh Flow

1. A protected request receives `401 Unauthorized`.
2. The response interceptor checks for a refresh token.
3. The client sends `POST /auth/refresh` with `{ refreshToken }`.
4. The new access token is saved.
5. The original request is retried once with the new bearer token.
6. If refresh fails, reject the request and send the user back to login.

The interceptor retries a failed request only once to avoid infinite loops.

## Logout Flow

1. Clear access token, refresh token, and user data.
2. Reset in-memory auth state.
3. Navigate to the login or public entry screen.
4. Do not call protected endpoints after logout unless the user signs in again.

## Error Handling

Use `toApiError` from `src/services/api/responseHandler.ts` to normalize backend and network errors:

```ts
try {
  await http.get(endpoints.auth.me);
} catch (error) {
  const apiError = toApiError(error);
  showMessage(apiError.message);
}
```

The normalized error shape is:

```ts
interface ApiErrorPayload {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
```

## Security Rules

- Always use HTTPS outside local development.
- Do not log tokens.
- Do not place tokens in URLs.
- Prefer short-lived access tokens and longer-lived refresh tokens.
- Rotate refresh tokens if the backend supports it.
- Clear tokens when the user logs out or when refresh fails.
- Keep password reset tokens separate from access tokens.

## Implementation Checklist

- Configure the correct API base URL for each environment.
- Use `http` or `apiClient` for all backend calls.
- Save tokens immediately after login/register.
- Clear tokens on logout.
- Use the refresh endpoint for expired access tokens.
- Normalize errors before showing messages in the UI.
