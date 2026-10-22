export interface ApiRequestOptions {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly accessToken?: string;
  readonly signal?: AbortSignal;
}

export interface ApiResponseMetadata {
  readonly status: number;
  readonly retryAfter: string | null;
}

export type ApiResult =
  | (ApiResponseMetadata & { readonly kind: "http"; readonly body: unknown })
  | (ApiResponseMetadata & { readonly kind: "no-content" })
  | (ApiResponseMetadata & { readonly kind: "invalid-json" })
  | (ApiResponseMetadata & {
      readonly kind: "response-read-error";
      readonly cause: unknown;
    })
  | { readonly kind: "network-error"; readonly cause: unknown }
  | { readonly kind: "aborted" }
  | { readonly kind: "configuration-error" };
