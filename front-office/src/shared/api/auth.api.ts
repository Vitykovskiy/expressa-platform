import { authPaths, authStatuses } from "./auth.api.constants";
import type {
  AccessSession,
  AuthProfileApi,
  AuthApiClient,
  CurrentUserProfile,
  CurrentUserProfileDto,
  OtpRequestMetadata,
} from "./auth.api.types";

export function createAuthApi(client: AuthApiClient): AuthProfileApi {
  return {
    requestOtp: (phone) =>
      client.request(authPaths.requestOtp, isOtpRequestMetadata, {
        body: { phone },
        method: "POST",
        expectedStatus: authStatuses.requestOtp,
      }),
    verifyOtp: (phone, code) =>
      client.request(authPaths.verifyOtp, isAccessSession, {
        body: { phone, code, context: "customer" },
        credentials: "include",
        method: "POST",
        expectedStatus: authStatuses.success,
      }),
    refresh: () =>
      client.request(authPaths.refresh, isAccessSession, {
        credentials: "include",
        method: "POST",
        expectedStatus: authStatuses.success,
      }),
    logout: (pushSubscription) =>
      client.request(authPaths.logout, isEmptyResponse, {
        body: { pushSubscription },
        credentials: "include",
        method: "POST",
        expectedStatus: authStatuses.logout,
      }),
    getCurrentUser: async (accessToken) =>
      mapCurrentUserProfile(
        await client.request(authPaths.currentUser, isCurrentUserProfileDto, {
          headers: { authorization: `Bearer ${accessToken}` },
          method: "GET",
          expectedStatus: authStatuses.success,
        }),
      ),
  };
}

function isAccessSession(value: unknown): value is AccessSession {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    value.accessToken !== "" &&
    value.tokenType === "Bearer" &&
    isPositiveInteger(value.expiresInSeconds)
  );
}

export function isCurrentUserProfile(
  value: unknown,
): value is CurrentUserProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.phoneE164 === "string" &&
    value.phoneE164 !== "" &&
    (value.name === null ||
      (typeof value.name === "string" && value.name.trim() !== "")) &&
    (value.context === "customer" || value.context === "staff") &&
    (value.customer === null ||
      (isRecord(value.customer) &&
        isMembershipTimestamp(value.customer.registeredAt) &&
        typeof value.name === "string")) &&
    (value.employee === null ||
      (isRecord(value.employee) &&
        (value.employee.role === "barista" ||
          value.employee.role === "administrator") &&
        typeof value.employee.accessEnabled === "boolean"))
  );
}

export function isCurrentUserProfileDto(
  value: unknown,
): value is CurrentUserProfileDto {
  return (
    isRecord(value) &&
    (value.role === "customer" ||
      value.role === "barista" ||
      value.role === "administrator") &&
    isCurrentUserProfile(value)
  );
}

export function mapCurrentUserProfile(
  value: CurrentUserProfileDto,
): CurrentUserProfile {
  return {
    id: value.id,
    phoneE164: value.phoneE164,
    name: value.name,
    context: value.context,
    customer:
      value.customer === null
        ? null
        : { registeredAt: value.customer.registeredAt },
    employee:
      value.employee === null
        ? null
        : {
            role: value.employee.role,
            accessEnabled: value.employee.accessEnabled,
          },
  };
}

function isMembershipTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(
      value,
    )
  ) {
    return false;
  }

  if (!Number.isFinite(Date.parse(value)) || Number(value.slice(11, 13)) > 23) {
    return false;
  }

  const date = value.slice(0, 10);

  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

function isOtpRequestMetadata(value: unknown): value is OtpRequestMetadata {
  return (
    isRecord(value) &&
    isPositiveInteger(value.expiresInSeconds) &&
    isPositiveInteger(value.retryAfterSeconds)
  );
}

function isEmptyResponse(value: unknown): value is undefined {
  return value === undefined;
}
function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
