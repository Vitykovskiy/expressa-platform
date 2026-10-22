export interface OperationsBadgeProps {
  readonly label: string;
  readonly tone: "created" | "confirmed" | "ready" | "rejected" | "closed";
}
