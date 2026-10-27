export const SESSION_ENDPOINTS = {
  verify: "/api/v2/auth/otp/verify",
  refresh: "/api/v2/auth/refresh",
  logout: "/api/v2/auth/logout",
  identity: "/api/v2/me",
} as const;

export const MILLISECONDS_PER_SECOND = 1000;

export const SESSION_ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
