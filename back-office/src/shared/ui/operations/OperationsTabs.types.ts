export interface OperationsTabOption {
  readonly id: string;
  readonly label: string;
}

export interface OperationsTabsProps {
  readonly options: readonly OperationsTabOption[];
  readonly modelValue: string;
  readonly label: string;
}

export interface OperationsTabsEmits {
  "update:modelValue": [value: string];
}
