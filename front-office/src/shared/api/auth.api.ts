import { authPaths, authStatuses } from "./auth.api.constants";
import type {
  AccessSession,
  AuthApi,
  AuthApiClient,
  CurrentUser,
  OtpRequestMetadata,
} from "./auth.api.types";

export function createAuthApi(client: AuthApiClient): AuthApi {
  return {
    requestOtp: (phone) =>
      client.request(authPaths.requestOtp, isOtpRequestMetadata, {
        body: { phone },
        method: "POST",
        expectedStatus: authStatuses.requestOtp,
      }),
    verifyOtp: (phone, code) =>
      client.request(authPaths.verifyOtp, isAccessSession, {
        body: { phone, code },
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
    logout: () =>
      client.request(authPaths.logout, isEmptyResponse, {
        credentials: "include",
        method: "POST",
        expectedStatus: authStatuses.logout,
      }),
    getCurrentUser: (accessToken) =>
      client.request(authPaths.currentUser, isCurrentUser, {
        headers: { authorization: `Bearer ${accessToken}` },
        method: "GET",
        expectedStatus: authStatuses.success,
      }),
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

function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.phoneE164 === "string" &&
    value.phoneE164 !== "" &&
    (value.role === "customer" ||
      value.role === "barista" ||
      value.role === "administrator")
  );
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
