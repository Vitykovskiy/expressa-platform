export const authPaths = {
  currentUser: "/me",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  requestOtp: "/auth/otp/request",
  verifyOtp: "/auth/otp/verify",
} as const;

export const authStatuses = {
  logout: 204,
  requestOtp: 202,
  success: 200,
} as const;
