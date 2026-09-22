import type {
  OperationContext,
  OperationField,
} from "../../shared/lib/operations/operation.types";

export type NotificationLevel = "error" | "warning" | "success" | "info";
export type NotificationFailureCategory = "client" | "domain" | "technical";

export interface NormalizedFailure {
  code: string;
  details: unknown;
  occurrenceId: string;
  requestId: string | null;
  status: number | null;
  transportKind:
    "client" | "network" | "response" | "contract" | "cancelled" | "timeout";
}

export interface FailureNotice {
  category: NotificationFailureCategory;
  code: string;
  clientStack?: string;
  level: "error" | "warning";
  message: string;
  occurrenceId: string;
  requestId: string | null;
  status: number | null;
}

export type ErrorClassification =
  | { kind: "cancelled" }
  | {
      kind: "fieldValidation";
      fields: readonly OperationField[];
      notification?: FailureNotice;
    }
  | ({ kind: "domainRefusal" } & FailureNotice)
  | ({ kind: "failure" } & FailureNotice);

export interface ErrorTaxonomy {
  classify(error: unknown, context: OperationContext): ErrorClassification;
}
