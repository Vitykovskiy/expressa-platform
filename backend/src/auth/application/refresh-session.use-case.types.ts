import type { AuthUser } from "./auth-repository.types";

export type RefreshSessionConfiguration = {
  accessTokenAudience: string;
  accessTokenIssuer: string;
  accessTokenTtlMs: number;
};

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
  sessionExpiresAt: Date;
  user: AuthUser;
};

export type RefreshTokenParts = {
  sessionId: string;
  secret: string;
};
