export interface ApiErrorData {
  code: string;
  details: unknown;
  message: string;
  requestId: string | null;
  status?: number | null;
}
export type ResponseValidator<T> = (value: unknown) => value is T;
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  expectedStatus?: number | readonly number[];
}
export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}
