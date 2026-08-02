import type { UiTextFieldProps } from "./UiTextField.types";

export const UI_TEXT_FIELD_DEFAULTS = {
  modelValue: "",
} satisfies Required<Pick<UiTextFieldProps, "modelValue">>;
