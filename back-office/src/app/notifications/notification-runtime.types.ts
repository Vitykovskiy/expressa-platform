import type {
  OperationContext,
  OperationFieldTarget,
  OperationOutcomeKey,
  OperationPort,
  OperationRecovery,
  OperationRecoveryInvocation,
  OperationResult,
  OperationVisibility,
} from "../../shared/lib/operations/operation.types";
import type { InjectionKey } from "vue";
import type {
  NotificationFailureCategory,
  NotificationLevel,
} from "./error-taxonomy.types";
import type { NotificationHostEntry } from "../../shared/ui/notifications/NotificationHost.types";

export interface NotificationEntry extends NotificationHostEntry {
  readonly level: NotificationLevel;
}

export interface CapturedContext {
  readonly attemptId: string;
  readonly epoch: string;
  readonly fieldTargets?: Readonly<Record<string, OperationFieldTarget>>;
  readonly generation: number | null;
  readonly kind: OperationContext["kind"];
  readonly operationKey: string;
  readonly ownerIsActive?: () => boolean;
  readonly origin: OperationContext["origin"];
  readonly reportFailure?: boolean;
  readonly resourceKey: string;
}

export interface NotificationFailureMetadata {
  readonly category: NotificationFailureCategory;
  readonly clientStack?: string;
  readonly code: string;
  readonly requestId: string | null;
  readonly status: number | null;
}

export interface NotificationEpisode {
  category: NotificationFailureCategory;
  code: string;
  readonly context: CapturedContext;
  dismissed: boolean;
  entryId: string | null;
  latestAttemptId: string;
  latestFailure: NotificationFailureMetadata;
  occurrences: number;
}

export interface OperationGeneration {
  epoch: string;
  latestIssued: number;
  operationKey: string;
  resourceKey: string;
}

export interface RecoveryRegistration {
  active: boolean;
  readonly context: CapturedContext;
  readonly id: string;
  readonly recovery: OperationRecovery;
}

export interface TimedEntry {
  elapsed: number;
  lastTick: number;
}
export interface NotificationRuntime extends OperationPort {
  readonly entries: readonly NotificationEntry[];
  readonly visibleEntries: readonly NotificationEntry[];
  dismiss(id: string): void;
  clearSession(epoch: string): void;
  publishOutcome(key: OperationOutcomeKey, context: OperationContext): void;
  subscribe(listener: () => void): () => void;
}

export function sameNotificationEntries(
  left: readonly NotificationEntry[],
  right: readonly NotificationEntry[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.id === right[index]?.id &&
        entry.level === right[index]?.level &&
        entry.message === right[index]?.message &&
        entry.busy === right[index]?.busy &&
        entry.actionLabel === right[index]?.actionLabel,
    )
  );
}
export const notificationRuntimeKey: InjectionKey<NotificationRuntime> = Symbol(
  "notificationRuntime",
);
export type {
  OperationContext,
  OperationOutcomeKey,
  OperationRecovery,
  OperationRecoveryInvocation,
  OperationResult,
  OperationVisibility,
};
