import type { ApiHttpErrorDto } from "./http-error.types";

export function parseApiHttpError(value: unknown): ApiHttpErrorDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  if (!("code" in value) || typeof value.code !== "string") {
    return null;
  }

  if (!("message" in value) || typeof value.message !== "string") {
    return null;
  }

  if (
    !("details" in value) ||
    (value.details !== null &&
      (typeof value.details !== "object" || Array.isArray(value.details)))
  ) {
    return null;
  }

  if (!("requestId" in value) || typeof value.requestId !== "string") {
    return null;
  }

  return {
    code: value.code,
    message: value.message,
    details: value.details,
    requestId: value.requestId,
  };
}
