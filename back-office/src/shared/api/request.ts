import { DEFAULT_API_BASE_URL, HTTP_NO_CONTENT } from "./request.constants";
import type { ApiRequestOptions, ApiResult } from "./request.types";

export async function requestApi(
  path: string,
  options: ApiRequestOptions,
): Promise<ApiResult> {
  const configuredBase: unknown = import.meta.env.VITE_API_BASE_URL;
  const base =
    configuredBase === undefined ? DEFAULT_API_BASE_URL : configuredBase;

  if (typeof base !== "string" || !path.startsWith("/api/")) {
    return { kind: "configuration-error" };
  }

  let url: URL;

  try {
    const baseUrl = new URL(base, import.meta.url);

    url = new URL(path.slice(1), baseUrl);
  } catch {
    return { kind: "configuration-error" };
  }

  const headers = new Headers({ Accept: "application/json" });

  if (options.accessToken !== undefined) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method,
      headers,
      credentials: "include",
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
  } catch (cause: unknown) {
    if (options.signal?.aborted) {
      return { kind: "aborted" };
    }

    return { kind: "network-error", cause };
  }

  const metadata = {
    status: response.status,
    retryAfter: response.headers.get("Retry-After"),
  };

  if (response.status === HTTP_NO_CONTENT) {
    return { kind: "no-content", ...metadata };
  }

  try {
    const body: unknown = await response.json();

    return { kind: "http", ...metadata, body };
  } catch (cause: unknown) {
    if (options.signal?.aborted) {
      return { kind: "aborted" };
    }

    if (cause instanceof SyntaxError) {
      return { kind: "invalid-json", ...metadata };
    }

    return { kind: "response-read-error", ...metadata, cause };
  }
}
