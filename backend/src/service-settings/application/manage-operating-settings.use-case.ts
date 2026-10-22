import type {
  OperatingSettingsRepository,
  SaveOperatingSettingsCommand,
} from "./operating-settings.types";
import type { OperatingSettings } from "../domain/operating-settings.types";
import { validateOperatingSettings } from "../domain/operating-settings";

export class ManageOperatingSettingsUseCase {
  constructor(private readonly repository: OperatingSettingsRepository) {}
  get(): Promise<OperatingSettings> {
    return this.repository.get();
  }
  save(command: SaveOperatingSettingsCommand): Promise<OperatingSettings> {
    validateOperatingSettings(command.settings);
    return this.repository.save(command);
  }
}
