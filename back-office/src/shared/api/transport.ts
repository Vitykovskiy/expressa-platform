import { requestTimeoutMs } from "./transport.constants";
import type {
  ApiErrorDto,
  ApiFailureKind,
  ApiRequest,
} from "./transport.types";

export class ApiFailure extends Error {
  constructor(
    readonly kind: ApiFailureKind,
    readonly status: number | null = null,
    readonly response: ApiErrorDto | null = null,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`API ${kind}`);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function contractFailure(): never {
  throw new ApiFailure("contract");
}

export async function request(
  path: string,
  options: ApiRequest,
): Promise<unknown> {
  let response: Response;
  const timeout = AbortSignal.timeout(requestTimeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.token === undefined
          ? {}
          : { Authorization: `Bearer ${options.token}` }),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiFailure(options.signal?.aborted ? "aborted" : "network");
  }

  if (response.status === options.expectedStatus && response.status === 204) {
    return null;
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new ApiFailure("contract", response.status);
  }

  if (response.status !== options.expectedStatus) {
    if (
      !isRecord(data) ||
      typeof data.code !== "string" ||
      typeof data.message !== "string" ||
      typeof data.requestId !== "string" ||
      !(data.details === null || isRecord(data.details))
    ) {
      throw new ApiFailure("contract", response.status);
    }

    const retry = response.headers.get("Retry-After");
    const seconds =
      retry !== null && /^\d+$/.test(retry) ? Number(retry) : null;

    throw new ApiFailure(
      "http",
      response.status,
      {
        code: data.code,
        message: data.message,
        requestId: data.requestId,
        details: data.details,
      },
      seconds !== null && Number.isSafeInteger(seconds) ? seconds : null,
    );
  }

  return data;
}
