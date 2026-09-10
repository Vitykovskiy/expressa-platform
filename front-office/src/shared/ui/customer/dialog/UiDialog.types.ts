export interface UiDialogFocusTarget {
  $el: unknown;
}

export interface UiDialogProps {
  label?: string;
  modelValue?: boolean;
  returnFocusTo?: HTMLElement | UiDialogFocusTarget | null;
}

export interface UiDialogEmits {
  "update:modelValue": [value: boolean];
}
