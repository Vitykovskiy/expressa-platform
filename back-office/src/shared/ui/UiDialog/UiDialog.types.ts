import type { VNode } from "vue";

export interface UiDialogProps {
  open: boolean;
  title: string;
  dismissible?: boolean;
  restoreFocus?: boolean;
}
export interface UiDialogEmits {
  "update:open": [value: boolean];
  closed: [];
}
export interface UiDialogSlots {
  default: () => VNode[];
  actions: () => VNode[];
}
