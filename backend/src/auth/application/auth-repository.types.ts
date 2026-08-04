import type { OtpChallenge, UserRole } from '../domain/auth.types';

export type AuthUser = {
  id: string;
  phoneE164: string;
  role: UserRole;
};

export type StoredOtpChallenge = OtpChallenge & {
  id: string;
  codeHash: string;
};

export type OtpChallengeReservation =
  | { status: 'created'; challenge: StoredOtpChallenge }
  | { status: 'rate_limited' };

export type AuthSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  rotatedAt: Date | null;
};

export type OtpAuthentication =
  | { status: 'authenticated'; user: AuthUser; session: AuthSession }
  | { status: 'invalid'; challenge: StoredOtpChallenge }
  | { status: 'unavailable'; challenge: StoredOtpChallenge | null }
  | { status: 'session_conflict' };

export type SessionWithUser = {
  session: AuthSession;
  user: AuthUser;
};

export type SessionRotation =
  | { status: 'rotated'; session: AuthSession; user: AuthUser }
  | { status: 'mismatch'; session: AuthSession; user: AuthUser }
  | { status: 'unavailable' };

export type SessionLogout =
  | { status: 'revoked'; session: AuthSession }
  | { status: 'unavailable' };

export interface AuthRepository {
  findOpenOtpChallenge(phoneE164: string): Promise<StoredOtpChallenge | null>;
  reserveOtpChallenge(
    phoneE164: string,
    codeHash: string,
    expiresAt: Date,
    sentAt: Date,
    challengeId: string,
  ): Promise<OtpChallengeReservation>;
  invalidateOtpChallenge(challengeId: string, now: Date): Promise<void>;
  verifyOtpAndCreateSession(
    phoneE164: string,
    codeHash: string,
    now: Date,
    sessionId: string,
    refreshTokenHash: string,
    sessionExpiresAt: Date,
  ): Promise<OtpAuthentication>;
  findOrCreateCustomer(phoneE164: string): Promise<AuthUser>;
  findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  findSessionWithUser(sessionId: string, now: Date): Promise<SessionWithUser | null>;
  rotateSession(
    sessionId: string,
    expectedRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    now: Date,
  ): Promise<SessionRotation>;
  logoutSession(
    sessionId: string,
    expectedRefreshTokenHash: string,
    now: Date,
  ): Promise<SessionLogout>;
  revokeSession(sessionId: string, now: Date): Promise<AuthSession | null>;
  findCurrentUser(sessionId: string, now: Date): Promise<AuthUser | null>;
}
