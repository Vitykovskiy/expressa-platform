export interface UiProgressProps {
  kind?: "linear" | "circular";
  label: string;
  modelValue?: number;
  color?: string;
  rounded?: boolean;
  indeterminate?: boolean;
}
