export interface OperationsButtonProps {
  readonly label: string;
  readonly kind?: "primary" | "secondary" | "destructive" | "ghost";
  readonly disabled?: boolean;
  readonly type?: "button" | "submit" | "reset";
  readonly compact?: boolean;
  readonly form?: string;
}

export interface OperationsButtonEmits {
  click: [event: MouseEvent];
}
