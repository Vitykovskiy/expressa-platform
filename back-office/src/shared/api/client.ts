import {
  apiContractErrorCode,
  apiErrorContractErrorMessage,
  apiResponseContractErrorMessage,
  apiStatusContractErrorMessage,
  invalidSameOriginApiBaseUrlMessage,
  jsonContentTypeHeader,
  jsonContentTypeValue,
  networkErrorCode,
  networkErrorMessage,
  noContentStatus,
  sameOriginApiBaseUrl,
} from "./client.constants";
import type {
  ApiClientOptions,
  ApiErrorData,
  ApiErrorPayload,
  ApiRequestOptions,
  ApiTransportKind,
  ApiRequestReceipt,
  ApiRequestOutcome,
  ApiRequestDescriptor,
  ApiRequestFeedback,
  ApiRequestReporting,
  ResponseValidator,
} from "./client.types";
export { apiClientKey } from "./client.constants";

export type {
  ApiClientOptions,
  ApiErrorData,
  ApiErrorPayload,
  ApiRequestOptions,
  ApiTransportKind,
  ResponseValidator,
} from "./client.types";

export class ApiError extends Error implements ApiErrorData {
  readonly code: string;
  readonly details: unknown;
  readonly occurrenceId: string;
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;
  readonly status: number | null;
  readonly transportKind: ApiTransportKind;
  readonly settlement?: ApiRequestReceipt;

  constructor({
    code,
    details,
    message,
    occurrenceId = createOccurrenceId(),
    requestId,
    retryAfterSeconds = null,
    status = null,
    transportKind = "response",
    settlement,
  }: ApiErrorData) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.occurrenceId = occurrenceId;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
    this.status = status;
    this.transportKind = transportKind;
    this.settlement = settlement;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor({ baseUrl, fetcher = fetch }: ApiClientOptions) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher.bind(globalThis);
  }

  async request<T>(
    path: string,
    validate: ResponseValidator<T>,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const { expectedStatus, feedback, ...requestOptions } = options;
    let receipt: ApiRequestReceipt | undefined;
    let settle: ((outcome: ApiRequestOutcome) => void) | undefined;
    const issued = () => {
      receipt = { id: createOccurrenceId(), reported: false };
      try {
        if (feedback !== undefined) feedback.receipt = receipt;
      } catch {
        console.error("request_feedback_receipt_failed");
      }
      try {
        settle = feedback?.begin();
      } catch {
        console.error("request_feedback_start_failed");
      }
    };
    const report = (outcome: ApiRequestOutcome) => {
      if (settle === undefined || outcome.receipt.reported) return;
      outcome.receipt.reported = true;
      try {
        settle(outcome);
      } catch {
        console.error("request_feedback_settlement_failed");
      }
    };
    try {
      const response = await this.fetchResponse(path, requestOptions, issued);
      const payload =
        response.status === noContentStatus
          ? undefined
          : await this.readPayload(response, requestOptions);

      if (!response.ok) {
        throw this.createApiError(payload, response, response.status);
      }

      if (!matchesExpectedStatus(response.status, expectedStatus)) {
        throw new ApiError({
          code: apiContractErrorCode,
          details: payload,
          message: apiStatusContractErrorMessage,
          requestId: response.headers.get("x-request-id"),
          status: response.status,
          transportKind: "contract",
        });
      }

      if (!validate(payload)) {
        throw new ApiError({
          code: apiContractErrorCode,
          details: payload,
          message: apiResponseContractErrorMessage,
          requestId: response.headers.get("x-request-id"),
          status: response.status,
          transportKind: "contract",
        });
      }

      if (receipt !== undefined) report({ status: "success", receipt });
      return payload;
    } catch (error) {
      if (receipt !== undefined) {
        if (
          (typeof error === "object" && error !== null) ||
          typeof error === "function"
        ) {
          try {
            Object.defineProperty(error, "settlement", {
              value: receipt,
              enumerable: true,
            });
          } catch {
            console.error("request_feedback_receipt_failed");
          }
        }
        report({ status: "failure", error, receipt });
      }
      throw error;
    }
  }

  private async fetchResponse(
    path: string,
    options: ApiRequestOptions,
    issued: () => void,
  ): Promise<Response> {
    let request: RequestInit;
    let url: string;

    try {
      url = this.createUrl(path);
      request = this.createRequest(options);
    } catch (error) {
      throw new ApiError({
        code: apiContractErrorCode,
        details: error,
        message: apiResponseContractErrorMessage,
        requestId: null,
        status: null,
        transportKind: "client",
      });
    }

    try {
      issued();
      return await this.fetcher(url, request);
    } catch (error) {
      throw new ApiError({
        code: networkErrorCode,
        details: error,
        message: networkErrorMessage,
        requestId: null,
        status: null,
        transportKind: transportKindFor(error, options.abortKind),
      });
    }
  }

  private createRequest({
    body,
    headers,
    ...options
  }: ApiRequestOptions): RequestInit {
    delete options.abortKind;

    if (body === undefined) {
      return { ...options, headers };
    }

    return {
      ...options,
      body: JSON.stringify(body),
      headers: {
        [jsonContentTypeHeader]: jsonContentTypeValue,
        ...headers,
      },
    };
  }

  private createUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, "");

    if (this.baseUrl.startsWith("/")) {
      const url = new URL(normalizedPath, sameOriginApiBaseUrl);

      return `${url.pathname}${url.search}${url.hash}`;
    }

    return new URL(normalizedPath, `${this.baseUrl}/`).toString();
  }

  private async readPayload(
    response: Response,
    options: ApiRequestOptions,
  ): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      const transportKind = transportKindFor(error, options.abortKind);
      if (transportKind === "cancelled" || transportKind === "timeout") {
        throw new ApiError({
          code: networkErrorCode,
          details: error,
          message: networkErrorMessage,
          requestId: response.headers.get("x-request-id"),
          status: response.status,
          transportKind,
        });
      }

      return null;
    }
  }

  private createApiError(
    payload: unknown,
    response: Response,
    status: number,
  ): ApiError {
    const retryAfterSeconds = parseRetryAfter(
      response.headers.get("retry-after"),
    );
    const requestId = response.headers.get("x-request-id");
    if (isApiErrorPayload(payload)) {
      return new ApiError({
        code: payload.code,
        details: payload.details,
        message: payload.message,
        requestId: requestId ?? payload.requestId,
        retryAfterSeconds,
        status,
        transportKind: "response",
      });
    }

    return new ApiError({
      code: apiContractErrorCode,
      details: payload,
      message: apiErrorContractErrorMessage,
      requestId,
      status,
    });
  }
}

function createOccurrenceId(): string {
  return crypto.randomUUID();
}

function parseRetryAfter(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

function matchesExpectedStatus(
  status: number,
  expectedStatus: ApiRequestOptions["expectedStatus"],
): boolean {
  if (expectedStatus === undefined) {
    return true;
  }

  return typeof expectedStatus === "number"
    ? status === expectedStatus
    : expectedStatus.includes(status);
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasOwn(value, "code") &&
    typeof value.code === "string" &&
    hasOwn(value, "message") &&
    typeof value.message === "string" &&
    hasOwn(value, "details") &&
    hasOwn(value, "requestId") &&
    (typeof value.requestId === "string" || value.requestId === null)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.hasOwn(value, key);
}

function transportKindFor(
  error: unknown,
  abortKind: ApiRequestOptions["abortKind"],
): ApiTransportKind {
  if (isTimeoutError(error)) return "timeout";
  if (isAbortError(error) && abortKind !== undefined) return "cancelled";
  return "network";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

export function createApiClient(
  apiBaseUrl: string,
  fetcher?: typeof fetch,
): ApiClient {
  if (apiBaseUrl === "/") {
    return new ApiClient({ baseUrl: "/api/v2", fetcher });
  }

  if (apiBaseUrl.startsWith("/")) {
    throw new Error(invalidSameOriginApiBaseUrlMessage);
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");

  return new ApiClient({ baseUrl: `${normalizedBaseUrl}/api/v2`, fetcher });
}

export function createRequestFeedback(
  reporting: ApiRequestReporting | undefined,
  descriptor: ApiRequestDescriptor,
): ApiRequestFeedback | undefined {
  try {
    return reporting?.(descriptor);
  } catch {
    console.error("request_feedback_context_failed");
    return undefined;
  }
}

export function requestReceipt(
  feedback: ApiRequestFeedback | undefined,
): ApiRequestReceipt | undefined {
  try {
    return feedback?.receipt;
  } catch {
    return undefined;
  }
}
