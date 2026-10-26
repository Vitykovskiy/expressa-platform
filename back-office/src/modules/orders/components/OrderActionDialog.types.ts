export interface OrderActionDialogCopy {
  readonly title: string;
  readonly description: string;
  readonly action: string;
}

export interface OrderActionDialogProps {
  readonly mode: "reject" | "issue" | null;
  readonly reason: string;
  readonly pending: boolean;
  /** Блокирует отправку отказа; выдачу дополнительно проверяет владелец команды. */
  readonly commandsDisabled: boolean;
  readonly errorMessage: string | null;
}

export interface OrderActionDialogEmits {
  close: [];
  reject: [reason: string];
  issue: [];
  "update:reason": [reason: string];
}
