import type { OperatingSettingsDto } from "./settings.dto.types";
import type {
  OperatingSettings,
  SettingsDraft,
  SettingsInput,
} from "./settings.types";

export function mapSettings(dto: OperatingSettingsDto): OperatingSettings {
  return {
    opensAt: dto.opensAt,
    closesAt: dto.closesAt,
    slotCapacity: dto.slotCapacity,
    slotMinutes: dto.slotMinutes,
    timeZone: dto.timeZone,
    updatedAt: dto.updatedAt,
  };
}

export function settingsToDraft(settings: SettingsInput): SettingsDraft {
  return {
    opensAt: settings.opensAt,
    closesAt: settings.closesAt,
    slotCapacity: String(settings.slotCapacity),
  };
}

export function sameSettings(
  left: SettingsInput,
  right: SettingsInput,
): boolean {
  return (
    left.opensAt === right.opensAt &&
    left.closesAt === right.closesAt &&
    left.slotCapacity === right.slotCapacity
  );
}
