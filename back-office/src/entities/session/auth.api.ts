import { contractFailure, isRecord, request } from "../../shared/api/transport";
import type { NativePushProof } from "../../shared/browser/web-push.types";
import { phonePattern, userRoles } from "./session.constants";
import type {
  AccessTokenDto,
  CurrentUserDto,
  OtpMetadataDto,
  UserRole,
} from "./session.types";

function parseToken(value: unknown): AccessTokenDto {
  if (
    !isRecord(value) ||
    typeof value.accessToken !== "string" ||
    value.accessToken.trim() === "" ||
    value.tokenType !== "Bearer" ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    typeof value.expiresInSeconds !== "number" ||
    value.expiresInSeconds <= 0
  ) {
    return contractFailure();
  }

  return {
    accessToken: value.accessToken,
    tokenType: value.tokenType,
    expiresInSeconds: value.expiresInSeconds,
  };
}

export async function requestOtp(phone: string): Promise<OtpMetadataDto> {
  const value = await request("/api/v2/auth/otp/request", {
    method: "POST",
    body: { phone },
    expectedStatus: 202,
  });

  if (
    !isRecord(value) ||
    typeof value.expiresInSeconds !== "number" ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    value.expiresInSeconds <= 0 ||
    typeof value.retryAfterSeconds !== "number" ||
    !Number.isSafeInteger(value.retryAfterSeconds) ||
    value.retryAfterSeconds < 0
  ) {
    return contractFailure();
  }

  return {
    expiresInSeconds: value.expiresInSeconds,
    retryAfterSeconds: value.retryAfterSeconds,
  };
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<AccessTokenDto> {
  return parseToken(
    await request("/api/v2/auth/otp/verify", {
      method: "POST",
      body: { phone, code },
      expectedStatus: 200,
    }),
  );
}

export async function refreshToken(): Promise<AccessTokenDto> {
  return parseToken(
    await request("/api/v2/auth/refresh", {
      method: "POST",
      expectedStatus: 200,
    }),
  );
}

export async function readUser(token: string): Promise<CurrentUserDto> {
  const value = await request("/api/v2/me", { token, expectedStatus: 200 });

  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.trim() === "" ||
    typeof value.phoneE164 !== "string" ||
    !phonePattern.test(value.phoneE164) ||
    typeof value.role !== "string" ||
    !userRoles.includes(value.role as UserRole)
  ) {
    return contractFailure();
  }

  return {
    id: value.id,
    phoneE164: value.phoneE164,
    role: value.role as UserRole,
  };
}

export async function endSession(
  proof: NativePushProof | null = null,
): Promise<void> {
  await request("/api/v2/auth/logout", {
    method: "POST",
    body: { pushSubscription: proof },
    expectedStatus: 204,
  });
}
