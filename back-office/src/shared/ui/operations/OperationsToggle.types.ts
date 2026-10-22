export interface OperationsToggleProps {
  readonly label: string;
  readonly description: string;
  readonly modelValue: boolean;
  readonly disabled?: boolean;
  readonly divider?: boolean;
}

export interface OperationsToggleEmits {
  "update:modelValue": [value: boolean];
}
