import type {
  OperatingSettings,
  OperatingSettingsInput,
} from "../domain/operating-settings.types";
export type SaveOperatingSettingsCommand = {
  settings: OperatingSettingsInput;
  actorId: string;
  requestId: string;
  occurredAt: Date;
};
export interface OperatingSettingsRepository {
  get(): Promise<OperatingSettings>;
  save(command: SaveOperatingSettingsCommand): Promise<OperatingSettings>;
}
