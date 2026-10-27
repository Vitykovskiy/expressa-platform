import type { ApiClient } from "./client";

export type AuthApi = {
  getCurrentUser(accessToken: string): Promise<CurrentUser>;
  logout(pushSubscription: LogoutPushSubscription | null): Promise<void>;
  refresh(): Promise<AccessSession>;
  requestOtp(phone: string): Promise<OtpRequestMetadata>;
  verifyOtp(phone: string, code: string): Promise<AccessSession>;
};

export type LogoutPushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type AccessSession = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
};

export type CurrentUser = {
  id: string;
  phoneE164: string;
  name: string | null;
  context: "customer" | "staff";
  customer: { registeredAt: string } | null;
  employee: {
    role: "barista" | "administrator";
    accessEnabled: boolean;
  } | null;
};

export type CurrentUserProfile = CurrentUser;

export type CurrentUserProfileDto = CurrentUserProfile & {
  role: "customer" | "barista" | "administrator";
};

export type AuthProfileApi = Omit<AuthApi, "getCurrentUser"> & {
  getCurrentUser(accessToken: string): Promise<CurrentUserProfile>;
};

export type OtpRequestMetadata = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type AuthApiClient = Pick<ApiClient, "request">;
