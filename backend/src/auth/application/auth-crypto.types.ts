export type AccessTokenIssue = {
  audience: string;
  issuer: string;
  now: Date;
  sessionId: string;
  subject: string;
  ttlMs: number;
};

export type AccessTokenClaims = {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sid: string;
  sub: string;
};

export type AccessTokenVerification = {
  audience: string;
  issuer: string;
  now: Date;
};

export interface AuthCrypto {
  createAccessToken(input: AccessTokenIssue): string;
  createOtpHash(challengeId: string, phone: string, code: string): string;
  generateRefreshSecret(): string;
  generateSessionId(): string;
  hashRefreshToken(token: string): string | null;
  verifyAccessToken(
    token: string,
    input: AccessTokenVerification,
  ): AccessTokenClaims | null;
  verifyOtpHash(
    challengeId: string,
    phone: string,
    code: string,
    expectedHash: string,
  ): boolean;
}
