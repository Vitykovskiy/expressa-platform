import { parseApiHttpError } from "../../../shared/api/http-error";
import { requestApi } from "../../../shared/api/request";
import { OTP_REQUEST_ENDPOINT } from "./auth.api.constants";
import type { OtpRequestOutcome, RequestOtpDto } from "./auth.api.types";

export async function requestOtp(
  phone: string,
  signal: AbortSignal,
): Promise<OtpRequestOutcome> {
  const response = await requestApi(OTP_REQUEST_ENDPOINT, {
    method: "POST",
    body: { phone },
    signal,
  });

  if (response.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (response.kind !== "http") {
    return { kind: "uncertain" };
  }

  const error = parseApiHttpError(response.body);

  if (response.status === 202 && isOtpRequestResponse(response.body)) {
    return { kind: "sent", retryAfterSeconds: response.body.retryAfterSeconds };
  }

  if (response.status === 429 && error?.code === "AUTH_RATE_LIMITED") {
    return {
      kind: "rate-limited",
      retryAfterSeconds: parseRetryAfterSeconds(response.retryAfter),
    };
  }

  if (response.status === 400 && error?.code === "VALIDATION_ERROR") {
    return { kind: "invalid-phone" };
  }

  if (response.status === 503 && error?.code === "SERVICE_UNAVAILABLE") {
    return { kind: "unavailable" };
  }

  return { kind: "uncertain" };
}

function isOtpRequestResponse(value: unknown): value is RequestOtpDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("expiresInSeconds" in value) ||
    typeof value.expiresInSeconds !== "number" ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    value.expiresInSeconds <= 0
  ) {
    return false;
  }

  if (
    !("retryAfterSeconds" in value) ||
    typeof value.retryAfterSeconds !== "number" ||
    !Number.isSafeInteger(value.retryAfterSeconds) ||
    value.retryAfterSeconds < 0
  ) {
    return false;
  }

  return true;
}

function parseRetryAfterSeconds(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const seconds = Number(value);

  return Number.isSafeInteger(seconds) ? seconds : null;
}
