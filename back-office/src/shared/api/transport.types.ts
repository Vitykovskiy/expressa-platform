export interface ApiErrorDto {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  requestId: string;
}
export interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  expectedStatus: number;
}
export type ApiFailureKind = "http" | "network" | "contract" | "aborted";
