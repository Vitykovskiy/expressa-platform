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
  settlement?: ApiRequestReceipt;
}

export interface ApiRequestReceipt {
  readonly id: string;
  reported: boolean;
}

export interface ApiRequestDescriptor {
  readonly operationKey: string;
  readonly resourceKey: string;
  readonly kind: "read" | "mutation";
}

export type ApiRequestOutcome =
  | { readonly status: "success"; readonly receipt: ApiRequestReceipt }
  | {
      readonly status: "failure";
      readonly error: unknown;
      readonly receipt: ApiRequestReceipt;
    };

export interface ApiRequestFeedback {
  receipt?: ApiRequestReceipt;
  begin(): (outcome: ApiRequestOutcome) => void;
}

export type ApiRequestReporting = (
  descriptor: ApiRequestDescriptor,
) => ApiRequestFeedback;

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
  feedback?: ApiRequestFeedback;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}
