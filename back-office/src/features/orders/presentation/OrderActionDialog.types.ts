export interface OrderActionDialogProps {
  readonly mode: "reject" | "issue" | null;
  readonly reason: string;
  readonly pending: boolean;
  readonly commandsDisabled: boolean;
  readonly errorMessage: string | null;
}

export interface OrderActionDialogEmits {
  close: [];
  reject: [reason: string];
  issue: [];
  "update:reason": [reason: string];
}
