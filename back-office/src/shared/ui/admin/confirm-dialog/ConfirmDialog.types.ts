export type ConfirmVariant = "primary" | "destructive";

export interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ConfirmVariant;
  cancelLabel?: string;
  requireInput?: boolean;
  pending?: boolean;
}

export interface ConfirmDialogEmits {
  confirm: [reason: string | undefined];
  cancel: [];
}
