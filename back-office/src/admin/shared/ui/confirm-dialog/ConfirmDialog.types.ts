export type ConfirmVariant = "primary" | "destructive";

export interface FocusableElement {
  focus: () => void;
}

export interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: ConfirmVariant;
  requireInput?: boolean;
  inputPlaceholder?: string;
}

export interface ConfirmDialogEmits {
  confirm: [reason: string | undefined];
  cancel: [];
}
