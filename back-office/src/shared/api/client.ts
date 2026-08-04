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
  ApiRequestOptions,
  ResponseValidator,
} from "./client.types";
export { apiClientKey } from "./client.constants";

export type {
  ApiClientOptions,
  ApiErrorData,
  ApiRequestOptions,
  ResponseValidator,
} from "./client.types";

export class ApiError extends Error implements ApiErrorData {
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | null;
  readonly status: number | null;

  constructor({
    code,
    details,
    message,
    requestId,
    status = null,
  }: ApiErrorData) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.status = status;
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
    const { expectedStatus, ...requestOptions } = options;
    const response = await this.fetchResponse(path, requestOptions);
    const payload =
      response.status === noContentStatus
        ? undefined
        : await this.readPayload(response);

    if (!response.ok) {
      throw this.createApiError(
        payload,
        response.headers.get("x-request-id"),
        response.status,
      );
    }

    if (!matchesExpectedStatus(response.status, expectedStatus)) {
      throw new ApiError({
        code: apiContractErrorCode,
        details: payload,
        message: apiStatusContractErrorMessage,
        requestId: response.headers.get("x-request-id"),
        status: response.status,
      });
    }

    if (!validate(payload)) {
      throw new ApiError({
        code: apiContractErrorCode,
        details: payload,
        message: apiResponseContractErrorMessage,
        requestId: response.headers.get("x-request-id"),
        status: response.status,
      });
    }

    return payload;
  }

  private async fetchResponse(
    path: string,
    options: ApiRequestOptions,
  ): Promise<Response> {
    try {
      return await this.fetcher(
        this.createUrl(path),
        this.createRequest(options),
      );
    } catch (error) {
      throw new ApiError({
        code: networkErrorCode,
        details: error,
        message: networkErrorMessage,
        requestId: null,
        status: null,
      });
    }
  }

  private createRequest({
    body,
    headers,
    ...options
  }: ApiRequestOptions): RequestInit {
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

  private async readPayload(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private createApiError(
    payload: unknown,
    requestId: string | null,
    status: number,
  ): ApiError {
    if (isApiErrorData(payload)) {
      return new ApiError({ ...payload, status });
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

function isApiErrorData(value: unknown): value is ApiErrorData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    "details" in value &&
    (typeof value.requestId === "string" || value.requestId === null)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createApiClient(
  apiBaseUrl: string,
  fetcher?: typeof fetch,
): ApiClient {
  if (apiBaseUrl === "/") {
    return new ApiClient({ baseUrl: "/api/v1", fetcher });
  }

  if (apiBaseUrl.startsWith("/")) {
    throw new Error(invalidSameOriginApiBaseUrlMessage);
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");

  return new ApiClient({ baseUrl: `${normalizedBaseUrl}/api/v1`, fetcher });
}
