import { parseApiHttpError } from "../../shared/api/http-error";
import { requestApi } from "../../shared/api/request";
import type { ApiResult } from "../../shared/api/request.types";
import {
  SESSION_ACCOUNT_ID_PATTERN,
  SESSION_ENDPOINTS,
} from "./session.constants";
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
    body: { phone, code, context: "staff" },
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
    identity: {
      id: dto.id,
      phone: dto.phoneE164,
      context: dto.context,
      customer: dto.customer,
      employee: dto.employee,
    },
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
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("accessToken" in value) ||
    typeof value.accessToken !== "string" ||
    value.accessToken.trim().length === 0
  ) {
    return false;
  }

  if (!("tokenType" in value) || value.tokenType !== "Bearer") {
    return false;
  }

  return (
    "expiresInSeconds" in value &&
    typeof value.expiresInSeconds === "number" &&
    Number.isSafeInteger(value.expiresInSeconds) &&
    value.expiresInSeconds > 0
  );
}

function isCurrentUser(value: unknown): value is CurrentUserDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("name" in value) ||
    (value.name !== null && typeof value.name !== "string")
  ) {
    return false;
  }

  if (
    !("id" in value) ||
    typeof value.id !== "string" ||
    value.id !== value.id.trim() ||
    !SESSION_ACCOUNT_ID_PATTERN.test(value.id)
  ) {
    return false;
  }

  if (
    !("phoneE164" in value) ||
    typeof value.phoneE164 !== "string" ||
    !/^\+7\d{10}$/.test(value.phoneE164)
  ) {
    return false;
  }

  if (!(
    "role" in value &&
    (value.role === "customer" ||
      value.role === "barista" ||
      value.role === "administrator")
  )) {
    return false;
  }

  if (
    !("context" in value) ||
    (value.context !== "customer" && value.context !== "staff")
  ) {
    return false;
  }

  if (!("customer" in value) || !("employee" in value)) {
    return false;
  }

  if (value.customer !== null) {
    const customer = value.customer;

    if (
      value.name === null ||
      value.name.trim() === "" ||
      typeof customer !== "object" ||
      Array.isArray(customer) ||
      !("registeredAt" in customer) ||
      typeof customer.registeredAt !== "string" ||
      !isMembershipTimestamp(customer.registeredAt)
    ) {
      return false;
    }
  }

  if (value.employee !== null) {
    const employee = value.employee;

    if (
      typeof employee !== "object" ||
      Array.isArray(employee) ||
      !("role" in employee) ||
      (employee.role !== "barista" && employee.role !== "administrator") ||
      !("accessEnabled" in employee) ||
      typeof employee.accessEnabled !== "boolean"
    ) {
      return false;
    }
  }

  return true;
}

function isMembershipTimestamp(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  ) {
    return false;
  }

  const calendarDate = value.slice(0, 10);

  return (
    new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) ===
    calendarDate
  );
}
