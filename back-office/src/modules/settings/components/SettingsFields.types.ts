import type { SettingsDraft } from "../settings.types";

export interface SettingsFieldsProps {
  readonly modelValue: SettingsDraft;
  readonly disabled: boolean;
}

export interface SettingsFieldsEmits {
  "update:modelValue": [value: SettingsDraft];
}
