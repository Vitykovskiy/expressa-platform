export const SESSION_ENDPOINTS = {
  verify: "/api/v2/auth/otp/verify",
  refresh: "/api/v2/auth/refresh",
  logout: "/api/v2/auth/logout",
  identity: "/api/v2/me",
} as const;

export const MILLISECONDS_PER_SECOND = 1000;
