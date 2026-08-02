export interface ApiErrorData {
  code: string;
  details: unknown;
  message: string;
  requestId: string | null;
}

export class ApiError extends Error implements ApiErrorData {
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor({ code, details, message, requestId }: ApiErrorData) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export type ResponseValidator<T> = (value: unknown) => value is T;

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor({ baseUrl, fetcher = fetch }: ApiClientOptions) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  async request<T>(
    path: string,
    validate: ResponseValidator<T>,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const response = await this.fetchResponse(path, options);
    const payload = await this.readPayload(response);

    if (!response.ok) {
      throw this.createApiError(payload, response.headers.get("x-request-id"));
    }

    if (!validate(payload)) {
      throw new ApiError({
        code: "API_CONTRACT_ERROR",
        details: payload,
        message: "Сервер вернул ответ, не соответствующий контракту API.",
        requestId: response.headers.get("x-request-id"),
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
        code: "NETWORK_ERROR",
        details: error,
        message: "Не удалось подключиться к серверу.",
        requestId: null,
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
        "content-type": "application/json",
        ...headers,
      },
    };
  }

  private createUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, "");

    if (this.baseUrl === "/") {
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

  private createApiError(payload: unknown, requestId: string | null): ApiError {
    if (isApiErrorData(payload)) {
      return new ApiError(payload);
    }

    return new ApiError({
      code: "API_CONTRACT_ERROR",
      details: payload,
      message: "Сервер вернул ошибку, не соответствующую контракту API.",
      requestId,
    });
  }
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

export const apiClientKey: InjectionKey<ApiClient> = Symbol("apiClient");

export function createApiClient(
  apiBaseUrl: string,
  fetcher?: typeof fetch,
): ApiClient {
  if (apiBaseUrl.startsWith("//")) {
    throw new Error(
      "Неверная конфигурация: VITE_API_BASE_URL не может быть protocol-relative URL.",
    );
  }

  if (apiBaseUrl === "/") {
    return new ApiClient({ baseUrl: "/", fetcher });
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");

  return new ApiClient({ baseUrl: `${normalizedBaseUrl}/api/v1`, fetcher });
}
import type { InjectionKey } from "vue";

const sameOriginApiBaseUrl = "https://same-origin.invalid/api/v1/";
