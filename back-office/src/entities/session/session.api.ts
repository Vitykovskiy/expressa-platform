import { parseApiHttpError } from "../../shared/api/http-error";
import { requestApi } from "../../shared/api/request";
import type { ApiResult } from "../../shared/api/request.types";
import { SESSION_ENDPOINTS } from "./session.constants";
import type {
  AccessTokenDto,
  CurrentUserDto,
  IdentityOutcome,
  TokenOutcome,
  LogoutPushProof,
} from "./session.types";

export async function verifySession(
  phone: string,
  code: string,
  signal: AbortSignal,
): Promise<TokenOutcome> {
  const response = await requestApi(SESSION_ENDPOINTS.verify, {
    method: "POST",
    body: { phone, code },
    signal,
  });

  if (response.kind === "http" && response.status === 401) {
    const error = parseApiHttpError(response.body);

    if (error?.code === "AUTH_CODE_INVALID") {
      return { kind: "invalid-code" };
    }

    if (error?.code === "AUTH_CODE_EXPIRED") {
      return { kind: "expired-code" };
    }
  }

  return readTokenOutcome(response);
}

export async function refreshSession(
  signal: AbortSignal,
): Promise<TokenOutcome> {
  const response = await requestApi(SESSION_ENDPOINTS.refresh, {
    method: "POST",
    signal,
  });

  if (response.kind === "http" && response.status === 401) {
    return { kind: "anonymous" };
  }

  return readTokenOutcome(response);
}

export async function readIdentity(
  accessToken: string,
  signal: AbortSignal,
): Promise<IdentityOutcome> {
  const response = await requestApi(SESSION_ENDPOINTS.identity, {
    method: "GET",
    accessToken,
    signal,
  });

  if (response.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (response.kind === "http" && response.status === 401) {
    return { kind: "anonymous" };
  }

  if (
    response.kind !== "http" ||
    response.status !== 200 ||
    !isCurrentUser(response.body)
  ) {
    return { kind: "uncertain" };
  }

  const dto = response.body;

  return {
    kind: "identity",
    identity: { id: dto.id, phone: dto.phoneE164, role: dto.role },
  };
}

export async function endSession(
  signal: AbortSignal,
  pushSubscription: LogoutPushProof | null = null,
): Promise<boolean> {
  const response = await requestApi(SESSION_ENDPOINTS.logout, {
    method: "POST",
    body: { pushSubscription },
    signal,
  });

  return response.kind === "no-content" && response.status === 204;
}

function readTokenOutcome(response: ApiResult): TokenOutcome {
  if (response.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (
    response.kind === "http" &&
    response.status === 200 &&
    isAccessToken(response.body)
  ) {
    return { kind: "token", token: response.body };
  }

  if (
    response.kind === "http" &&
    response.status === 503 &&
    parseApiHttpError(response.body)?.code === "SERVICE_UNAVAILABLE"
  ) {
    return { kind: "unavailable" };
  }

  return { kind: "uncertain" };
}

function isAccessToken(value: unknown): value is AccessTokenDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.trim().length > 0 &&
    "tokenType" in value &&
    value.tokenType === "Bearer" &&
    "expiresInSeconds" in value &&
    typeof value.expiresInSeconds === "number" &&
    Number.isSafeInteger(value.expiresInSeconds) &&
    value.expiresInSeconds > 0
  );
}

function isCurrentUser(value: unknown): value is CurrentUserDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    "phoneE164" in value &&
    typeof value.phoneE164 === "string" &&
    /^\+7\d{10}$/.test(value.phoneE164) &&
    "role" in value &&
    (value.role === "customer" ||
      value.role === "barista" ||
      value.role === "administrator")
  );
}
