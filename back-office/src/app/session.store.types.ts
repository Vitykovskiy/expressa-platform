import type { AuthApi } from "../shared/api/auth.api";
import type { AuthCurrentUser } from "../shared/api/auth.api.types";

export type SessionStatus =
  "unknown" | "anonymous" | "authenticated" | "denied";

export type StaffSessionUser = Omit<AuthCurrentUser, "role"> & {
  role: "barista" | "administrator";
};

export type SessionStoreError = {
  message: string;
  requestId: string | null;
};

export type SessionStoreState = {
  accessToken: string | null;
  currentUser: StaffSessionUser | null;
  error: SessionStoreError | null;
  status: SessionStatus;
};

export type SessionStoreDependencies = {
  authApi: Pick<
    AuthApi,
    "getCurrentUser" | "logout" | "refresh" | "requestOtp" | "verifyOtp"
  >;
};
