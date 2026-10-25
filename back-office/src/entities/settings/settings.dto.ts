import { SETTINGS_TIMESTAMP_PATTERN } from "./settings.constants";
import { isSettingsInputValid } from "./settings.validation";
import type { OperatingSettingsDto } from "./settings.dto.types";

export function parseSettingsDto(value: unknown): OperatingSettingsDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  if (
    !("opensAt" in value) ||
    typeof value.opensAt !== "string" ||
    !("closesAt" in value) ||
    typeof value.closesAt !== "string" ||
    !("slotCapacity" in value) ||
    typeof value.slotCapacity !== "number"
  ) {
    return null;
  }

  if (
    !("slotMinutes" in value) ||
    value.slotMinutes !== 10 ||
    !("timeZone" in value) ||
    value.timeZone !== "UTC"
  ) {
    return null;
  }

  if (!("updatedAt" in value) || !isSettingsUpdatedAt(value.updatedAt)) {
    return null;
  }

  const dto: OperatingSettingsDto = {
    opensAt: value.opensAt,
    closesAt: value.closesAt,
    slotCapacity: value.slotCapacity,
    slotMinutes: value.slotMinutes,
    timeZone: value.timeZone,
    updatedAt: value.updatedAt,
  };

  if (!isSettingsInputValid(dto)) {
    return null;
  }

  return dto;
}

function isSettingsUpdatedAt(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }

  if (
    typeof value !== "string" ||
    !SETTINGS_TIMESTAMP_PATTERN.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    return false;
  }

  // Date.parse может нормализовать несуществующий день месяца.
  const calendarDay = value.slice(0, 10);
  const midnightUtc = Date.parse(`${calendarDay}T00:00:00.000Z`);

  return (
    Number.isFinite(midnightUtc) &&
    new Date(midnightUtc).toISOString().slice(0, 10) === calendarDay
  );
}
