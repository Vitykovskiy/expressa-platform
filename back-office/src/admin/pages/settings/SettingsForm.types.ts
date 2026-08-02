import type { Settings } from "../../shared/ui/Admin.types";

export interface SettingsFormProps {
  settings: Settings;
}

export interface SettingsFormEmits {
  save: [settings: Settings];
}
