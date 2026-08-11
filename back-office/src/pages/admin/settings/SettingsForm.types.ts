import type { Settings } from "../../../shared/ui/admin/Admin.types";

export interface SettingsFormProps {
  settings: Settings;
}

export interface SettingsFormEmits {
  save: [settings: Settings];
}
