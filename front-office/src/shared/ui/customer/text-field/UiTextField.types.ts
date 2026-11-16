import type { ComputedRef, Ref } from "vue";

export interface UiTextFieldProps {
  modelValue?: string;
}

export interface UiTextFieldEmits {
  "update:modelValue": [value: string];
}

export type UiTextFieldInputSlotProps = {
  isActive: Ref<boolean>;
  isFocused: Ref<boolean>;
  iconColor: ComputedRef<string | undefined>;
  controlRef: Ref<InstanceType<typeof globalThis.HTMLElement> | undefined>;
  focus: () => void;
  blur: () => void;
};

export type UiTextFieldLoaderSlotProps = {
  color: string | undefined;
  isActive: boolean;
};
