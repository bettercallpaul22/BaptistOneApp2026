# BaptistOne Web Auth Documentation

This web app authenticates against the Baptist One API and stores the returned session locally so Axios can attach the bearer token to protected requests.

## API Setup

- Base URL: `VITE_API_BASE_URL=https://baptist-one-api.dokploy.rokswood.com`
- Auth app name: `baptist-one`
- Auth platform: `app`
- Register redirect URL: `https://baptist.ng/auth/callback`

These auth defaults live in `src/config/auth.ts`.

## Endpoints

| Action | Endpoint | Method | Result |
| --- | --- | --- | --- |
| Login | `/auth/sign-in?appName=baptist-one&platform=app` | `POST` | Authenticates and returns session data |
| Register | `/auth/sign-up?appName=baptist-one&platform=app&redirectUrl=...` | `POST` | Sends email verification link |

Login body:

```ts
{
  email: string;
  password: string;
}
```

Register body:

```ts
{
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
}
```

## Session Persistence

On successful login, the app persists:

- `newbaptist.accessToken`: `data.access.token`
- `newbaptist.refreshToken`: only when the API returns `data.access.refresh`
- `newbaptist.authData`: the full `data` object from the login response
- `newbaptist.user`: the returned user object

The Axios request interceptor reads from `tokenStore` and adds:

```http
Authorization: Bearer <token>
```

Logout clears only token/session auth status. Persisted user/profile data is intentionally kept so the app can tell the user has used BaptistOne before.

## Auth Check

On app mount, the router runs a local token check:

1. Read the stored access token.
2. Use `authData.access.expiresTimestamp` first.
3. Fall back to decoding the JWT `exp` claim.
4. Mark the user authenticated only when the token exists and has not expired.
5. Clear tokens and show a session-expired toast when an expired token is found.

The web app does not call `/auth/me` during boot.

## Register Flow

Register does not authenticate the user. On success, the app stores the registration email/message and navigates to the verification-sent page with an action to open the email app.

## Error Shape

The API can return errors like:

```ts
{
  errorCode: string;
  status: false;
  message: string;
  data: null;
}
```

Use `toApiError` to normalize this shape before showing UI messages.
