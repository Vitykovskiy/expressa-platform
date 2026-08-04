import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type {
  AccessTokenClaims,
  AccessTokenIssue,
  AccessTokenVerification,
  AuthCrypto,
} from '../application/auth-crypto.types';
import { jwtHeader, refreshTokenByteLength } from './node-auth-crypto.adapter.constants';
import type { JwtHeader, NodeAuthCryptoConfiguration } from './node-auth-crypto.adapter.types';

export class NodeAuthCryptoAdapter implements AuthCrypto {
  constructor(private readonly configuration: NodeAuthCryptoConfiguration) {}

  createAccessToken(input: AccessTokenIssue): string {
    if (!isValidAccessTokenIssue(input)) {
      throw new Error('Invalid access token input.');
    }

    const iat = Math.floor(input.now.getTime() / 1000);
    const payload: AccessTokenClaims = {
      aud: input.audience,
      exp: iat + input.ttlMs / 1000,
      iat,
      iss: input.issuer,
      sid: input.sessionId,
      sub: input.subject,
    };
    const encodedHeader = encodeBase64Url(JSON.stringify(jwtHeader));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signedContent = `${encodedHeader}.${encodedPayload}`;

    return `${signedContent}.${this.createJwtSignature(signedContent)}`;
  }

  createOtpHash(challengeId: string, phone: string, code: string): string {
    return createHmac('sha256', this.configuration.otpPepper)
      .update(`${challengeId}|${phone}|${code}`)
      .digest('base64url');
  }

  generateRefreshSecret(): string {
    return randomBytes(refreshTokenByteLength).toString('base64url');
  }

  generateSessionId(): string {
    const sessionId = randomUUID();

    if (!isUuid(sessionId)) {
      throw new Error('Could not generate session ID.');
    }

    return sessionId;
  }

  hashRefreshToken(token: string): string | null {
    if (!isRefreshToken(token)) {
      return null;
    }

    return createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(
    token: string,
    input: AccessTokenVerification,
  ): AccessTokenClaims | null {
    if (!isValidAccessTokenVerification(input)) {
      return null;
    }

    const parts = token.split('.');
    const [encodedHeader, encodedPayload, signature] = parts;
    if (
      parts.length !== 3 ||
      encodedHeader === undefined ||
      encodedPayload === undefined ||
      signature === undefined ||
      !isBase64Url(encodedHeader) ||
      !isBase64Url(encodedPayload) ||
      !isBase64Url(signature)
    ) {
      return null;
    }

    const signedContent = `${encodedHeader}.${encodedPayload}`;
    if (!this.matchesJwtSignature(signedContent, signature)) {
      return null;
    }

    const header = parseJson(encodedHeader);
    const claims = parseJson(encodedPayload);
    if (!isJwtHeader(header) || !isAccessTokenClaims(claims)) {
      return null;
    }

    const now = Math.floor(input.now.getTime() / 1000);
    if (
      claims.iss !== input.issuer ||
      claims.aud !== input.audience ||
      claims.iat > now ||
      claims.exp <= now
    ) {
      return null;
    }

    return claims;
  }

  verifyOtpHash(
    challengeId: string,
    phone: string,
    code: string,
    expectedHash: string,
  ): boolean {
    if (!isBase64Url(expectedHash)) {
      return false;
    }

    const actualHash = this.createOtpHash(challengeId, phone, code);
    const actual = Buffer.from(actualHash, 'base64url');
    const expected = Buffer.from(expectedHash, 'base64url');

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private createJwtSignature(signedContent: string): string {
    return createHmac('sha256', this.configuration.jwtSecret)
      .update(signedContent)
      .digest('base64url');
  }

  private matchesJwtSignature(signedContent: string, signature: string): boolean {
    const actual = Buffer.from(this.createJwtSignature(signedContent), 'base64url');
    const expected = Buffer.from(signature, 'base64url');

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function isAccessTokenClaims(value: unknown): value is AccessTokenClaims {
  return (
    isRecord(value) &&
    isNonEmptyString(value.aud) &&
    isUnixTimestamp(value.exp) &&
    isUnixTimestamp(value.iat) &&
    value.exp > value.iat &&
    isNonEmptyString(value.iss) &&
    isNonEmptyString(value.sid) &&
    isNonEmptyString(value.sub)
  );
}

function isBase64Url(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function isJwtHeader(value: unknown): value is JwtHeader {
  return isRecord(value) && value.alg === 'HS256' && value.typ === 'JWT';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isUnixTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRefreshToken(value: string): boolean {
  const [sessionId, secret] = value.split('.');
  if (
    sessionId === undefined ||
    secret === undefined ||
    value.split('.').length !== 2 ||
    !isUuid(sessionId) ||
    !isBase64Url(secret)
  ) {
    return false;
  }

  return Buffer.from(secret, 'base64url').length === refreshTokenByteLength;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidAccessTokenIssue(value: AccessTokenIssue): boolean {
  return (
    isNonEmptyString(value.audience) &&
    isNonEmptyString(value.issuer) &&
    value.now instanceof Date &&
    Number.isFinite(value.now.getTime()) &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.subject) &&
    Number.isInteger(value.ttlMs) &&
    value.ttlMs > 0 &&
    value.ttlMs % 1000 === 0
  );
}

function isValidAccessTokenVerification(value: AccessTokenVerification): boolean {
  return (
    isNonEmptyString(value.audience) &&
    isNonEmptyString(value.issuer) &&
    value.now instanceof Date &&
    Number.isFinite(value.now.getTime())
  );
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
