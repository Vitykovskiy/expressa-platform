import type { Settings } from "../../shared/ui/Admin.types";

export interface SettingsScreenProps {
  settings: Settings;
}

export interface SettingsScreenEmits {
  save: [settings: Settings];
}
