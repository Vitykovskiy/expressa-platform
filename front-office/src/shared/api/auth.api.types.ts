import type { ApiClient } from "./client";

export type AuthApi = {
  getCurrentUser(accessToken: string): Promise<CurrentUser>;
  logout(): Promise<void>;
  refresh(): Promise<AccessSession>;
  requestOtp(phone: string): Promise<OtpRequestMetadata>;
  verifyOtp(phone: string, code: string): Promise<AccessSession>;
};

export type AccessSession = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
};

export type CurrentUser = {
  id: string;
  phoneE164: string;
  role: "customer" | "barista" | "administrator";
};

export type OtpRequestMetadata = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type AuthApiClient = Pick<ApiClient, "request">;
