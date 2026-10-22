import { parseApiHttpError } from "../../shared/api/http-error";
import { requestApi } from "../../shared/api/request";
import { OTP_REQUEST_ENDPOINT } from "./auth.constants";
import type { OtpRequestOutcome, RequestOtpDto } from "./auth.types";

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

  if (response.status === 202 && isRequestMetadata(response.body)) {
    return { kind: "sent", retryAfterSeconds: response.body.retryAfterSeconds };
  }

  if (response.status === 429 && error?.code === "AUTH_RATE_LIMITED") {
    const seconds =
      response.retryAfter !== null && /^\d+$/.test(response.retryAfter)
        ? Number(response.retryAfter)
        : null;

    return {
      kind: "rate-limited",
      retryAfterSeconds:
        seconds !== null && Number.isSafeInteger(seconds) ? seconds : null,
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

function isRequestMetadata(value: unknown): value is RequestOtpDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "expiresInSeconds" in value &&
    typeof value.expiresInSeconds === "number" &&
    Number.isSafeInteger(value.expiresInSeconds) &&
    value.expiresInSeconds > 0 &&
    "retryAfterSeconds" in value &&
    typeof value.retryAfterSeconds === "number" &&
    Number.isSafeInteger(value.retryAfterSeconds) &&
    value.retryAfterSeconds >= 0
  );
}
