export type OperationKind = "read" | "mutation";
export type OperationOrigin = "user" | "automatic" | "recovery";
export type OperationOutcomeKey =
  | "catalog.saved"
  | "notifications.enabled"
  | "notifications.permissionDenied"
  | "orders.new"
  | "session.expired";

export interface OperationField {
  message: string;
  path: string;
}

export interface OperationFieldTarget {
  path: string;
}

export type OperationRecoverySafety =
  "read" | "idempotentMutation" | "reconciledMutation";

export interface OperationRecovery {
  actionLabel: string;
  execute: (
    invocation: OperationRecoveryInvocation,
  ) => Promise<OperationResult<unknown>>;
  safety: OperationRecoverySafety;
}

export interface OperationRecoveryInvocation {
  run<T>(execute: () => Promise<T>): Promise<OperationResult<T>>;
}

export interface OperationContext {
  attemptId: string;
  epoch: string;
  fieldTargets?: Readonly<Record<string, OperationFieldTarget>>;
  kind: OperationKind;
  operationKey: string;
  ownerIsActive?: () => boolean;
  origin: OperationOrigin;
  reportFailure?: boolean;
  resourceKey: string;
}

export type OperationResult<T> =
  | { status: "success"; value: T }
  | { status: "fieldValidation"; fields: readonly OperationField[] }
  | { status: "domainRefusal"; error: unknown }
  | { status: "cancelled" }
  | { status: "failure"; error: unknown }
  | { status: "unconfirmed"; error: unknown };

export interface OperationPort {
  dismiss(id: string): void;
  publishOutcome(key: OperationOutcomeKey, context: OperationContext): void;
  registerRecovery(
    context: OperationContext,
    recovery: OperationRecovery,
  ): () => void;
  recover(id: string): void;
  run<T>(
    context: OperationContext,
    execute: () => Promise<T>,
  ): Promise<OperationResult<T>>;
  resolve(operationKey: string, resourceKey: string, epoch: string): void;
  clearSession(epoch: string): void;
  setVisibility(visibility: OperationVisibility): void;
}

export interface OperationVisibility {
  availableHeight: number;
  focusedId: string | null;
  hoveredId: string | null;
  hidden: boolean;
  stackFits: boolean;
  viewportWidth: number;
}
