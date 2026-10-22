import {
  SETTINGS_CAPACITY_MAX,
  SETTINGS_CAPACITY_PATTERN,
  SETTINGS_TIME_PATTERN,
} from "./settings.constants";
import type { SettingsDraft, SettingsInput } from "./settings.types";

export function isSettingsInputValid(value: SettingsInput): boolean {
  return (
    SETTINGS_TIME_PATTERN.test(value.opensAt) &&
    SETTINGS_TIME_PATTERN.test(value.closesAt) &&
    value.opensAt < value.closesAt &&
    Number.isInteger(value.slotCapacity) &&
    value.slotCapacity >= 1 &&
    value.slotCapacity <= SETTINGS_CAPACITY_MAX
  );
}

export function parseSettingsDraft(draft: SettingsDraft): SettingsInput | null {
  if (!SETTINGS_CAPACITY_PATTERN.test(draft.slotCapacity)) {
    return null;
  }

  const input = {
    opensAt: draft.opensAt,
    closesAt: draft.closesAt,
    slotCapacity: Number(draft.slotCapacity),
  };

  return isSettingsInputValid(input) ? input : null;
}
