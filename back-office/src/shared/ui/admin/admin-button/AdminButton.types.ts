export type AdminButtonVariant =
  "primary" | "secondary" | "destructive" | "ghost";
export type AdminButtonType = "button" | "submit" | "reset";
export type AdminButtonSize = "default" | "compact";

export type AdminButtonPresentation = "control" | "row";

export interface AdminButtonProps {
  presentation?: AdminButtonPresentation;
  variant?: AdminButtonVariant;
  disabled?: boolean;
  pending?: boolean;
  type?: AdminButtonType;
  size?: AdminButtonSize;
}

export interface AdminButtonEmits {
  click: [event: MouseEvent];
}
