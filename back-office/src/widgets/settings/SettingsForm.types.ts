import type { SettingsDraft } from "../../entities/settings/settings.types";

export interface SettingsFormProps {
  readonly modelValue: SettingsDraft;
  readonly saving: boolean;
  readonly canSave: boolean;
  readonly locked: boolean;
}

export interface SettingsFormSlots {
  status?: () => unknown;
}

export interface SettingsFormEmits {
  "update:modelValue": [value: SettingsDraft];
  save: [];
}
