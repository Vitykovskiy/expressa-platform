import type { SettingsCommand } from "../settings.types";

export interface SettingsRecoveryProps {
  readonly command: SettingsCommand;
  readonly message: string;
}

export interface SettingsRecoveryEmits {
  inspect: [];
  finish: [];
}
