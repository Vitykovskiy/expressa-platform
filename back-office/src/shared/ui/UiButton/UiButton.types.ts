import type { VNode } from "vue";

export interface UiButtonProps {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}

export interface UiButtonEmits {
  activate: [event: MouseEvent];
}
export interface UiButtonSlots {
  default: () => VNode[];
}
