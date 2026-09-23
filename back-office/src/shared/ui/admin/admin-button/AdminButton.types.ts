export type AdminButtonVariant =
  "primary" | "secondary" | "destructive" | "ghost";
export type AdminButtonType = "button" | "submit" | "reset";
export type AdminButtonSize = "default" | "compact";

export interface AdminButtonProps {
  variant?: AdminButtonVariant;
  disabled?: boolean;
  pending?: boolean;
  type?: AdminButtonType;
  size?: AdminButtonSize;
}

export interface AdminButtonEmits {
  click: [event: MouseEvent];
}
