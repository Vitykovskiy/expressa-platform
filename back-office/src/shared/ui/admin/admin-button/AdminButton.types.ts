export type AdminButtonVariant =
  "primary" | "secondary" | "destructive" | "ghost";
export type AdminButtonType = "button" | "submit" | "reset";

export interface AdminButtonProps {
  variant?: AdminButtonVariant;
  disabled?: boolean;
  pending?: boolean;
  type?: AdminButtonType;
}

export interface AdminButtonEmits {
  click: [event: MouseEvent];
}
