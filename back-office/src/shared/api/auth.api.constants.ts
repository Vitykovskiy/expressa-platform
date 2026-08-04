export const authApiPaths = {
  currentUser: "/me",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  requestOtp: "/auth/otp/request",
  verifyOtp: "/auth/otp/verify",
} as const;

export const authRequestOptions = {
  credentials: "include",
} as const;

export const bearerTokenType = "Bearer";
