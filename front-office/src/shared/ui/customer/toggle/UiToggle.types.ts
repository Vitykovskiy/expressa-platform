export interface UiToggleProps {
  disabled?: boolean;
  modelValue?: boolean | null;
}

export interface UiToggleEmits {
  "update:modelValue": [value: boolean | null];
}

export type UiToggleLabelSlotProps = {
  label: string | undefined;
  props: Record<string, unknown>;
};
