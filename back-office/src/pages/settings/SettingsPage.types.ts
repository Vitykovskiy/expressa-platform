import type { SettingsDraft } from "../../entities/settings/settings.types";

export interface SettingsPageProps {
  readonly modelValue: SettingsDraft;
  readonly saving: boolean;
  readonly canSave: boolean;
  readonly saved: boolean;
  readonly locked: boolean;
  readonly feedback: string;
}

export interface SettingsPageSlots {
  status?: () => unknown;
}

export interface SettingsPageEmits {
  "update:modelValue": [value: SettingsDraft];
  save: [];
}
