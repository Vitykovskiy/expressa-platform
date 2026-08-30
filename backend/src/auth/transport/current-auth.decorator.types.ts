import type { UserRole } from "../domain/auth.types";

export type CurrentAuth = {
  phoneE164: string;
  role: UserRole;
  sessionId: string;
  userId: string;
};

export type AuthenticatedRequest = {
  auth?: CurrentAuth;
  headers: Record<string, unknown>;
};
