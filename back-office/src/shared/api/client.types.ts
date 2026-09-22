export type ApiTransportKind =
  "client" | "network" | "response" | "contract" | "cancelled" | "timeout";

export interface ApiErrorData {
  code: string;
  details: unknown;
  message: string;
  occurrenceId?: string;
  requestId: string | null;
  retryAfterSeconds?: number | null;
  status?: number | null;
  transportKind?: ApiTransportKind;
}

export interface ApiErrorPayload {
  code: string;
  details: unknown;
  message: string;
  requestId: string | null;
}

export type ResponseValidator<T> = (value: unknown) => value is T;

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  abortKind?: "deliberate" | "route" | "superseded";
  body?: unknown;
  expectedStatus?: number | readonly number[];
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}
