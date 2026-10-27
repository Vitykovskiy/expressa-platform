import type { AuthIdentity } from "../domain/auth.types";

export type CurrentAuth = AuthIdentity & {
  phoneE164: string;
  sessionId: string;
  userId: string;
};

export type AuthenticatedRequest = {
  auth?: CurrentAuth;
  headers: Record<string, unknown>;
};
