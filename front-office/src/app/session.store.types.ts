import type {
  AuthApi,
  CurrentUser,
  OtpRequestMetadata,
} from "../shared/api/auth.api.types";

export type {
  CurrentUser,
  OtpRequestMetadata,
} from "../shared/api/auth.api.types";

export type SessionStatus = "unknown" | "anonymous" | "authenticated";

export interface SessionState {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  errorMessage: string | null;
  otpExpiresAt: number | null;
  otpRequestMetadata: OtpRequestMetadata | null;
  otpRequestedAt: number | null;
  pendingPhone: string | null;
  phone: string | null;
  restorePromise: Promise<void> | null;
  status: SessionStatus;
}

export interface SessionDependencies {
  authApi: AuthApi;
  now(): number;
}
