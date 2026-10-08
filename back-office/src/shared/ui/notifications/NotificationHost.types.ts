export type NotificationHostLevel = "error" | "warning" | "success" | "info";

export interface NotificationHostEntry {
  readonly actionLabel?: string;
  readonly accounting?: string;
  readonly busy: boolean;
  readonly id: string;
  readonly level: NotificationHostLevel;
  readonly message: string;
}

export interface NotificationHostProps {
  readonly candidateEntries?: readonly NotificationHostEntry[];
  readonly entries: readonly NotificationHostEntry[];
}

export interface NotificationHostVisibility {
  readonly availableHeight: number;
  readonly hoveredId: string | null;
  readonly hidden: boolean;
  readonly stackFits: boolean;
  readonly viewportWidth: number;
}
