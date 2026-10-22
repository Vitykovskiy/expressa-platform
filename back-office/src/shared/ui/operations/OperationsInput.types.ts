import type { InputHTMLAttributes } from "vue";

export interface OperationsInputOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface OperationsInputProps {
  readonly label: string;
  readonly modelValue: string;
  readonly type?:
    "text" | "search" | "number" | "time" | "tel" | "select" | "reason";
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly hideLabel?: boolean;
  readonly options?: readonly OperationsInputOption[];
  readonly required?: boolean;
  readonly step?: string | number;
  readonly autocomplete?: string;
  readonly autofocus?: boolean;
  readonly "aria-describedby"?: string;
  readonly inputmode?: InputHTMLAttributes["inputmode"];
}

export interface OperationsInputEmits {
  "update:modelValue": [value: string];
}
