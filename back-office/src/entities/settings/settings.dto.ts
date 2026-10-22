import { SETTINGS_TIMESTAMP_PATTERN } from "./settings.constants";
import { isSettingsInputValid } from "./settings.validation";
import type { OperatingSettingsDto } from "./settings.dto.types";

export function parseSettingsDto(value: unknown): OperatingSettingsDto | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("opensAt" in value) ||
    typeof value.opensAt !== "string" ||
    !("closesAt" in value) ||
    typeof value.closesAt !== "string" ||
    !("slotCapacity" in value) ||
    typeof value.slotCapacity !== "number" ||
    !("slotMinutes" in value) ||
    value.slotMinutes !== 10 ||
    !("timeZone" in value) ||
    value.timeZone !== "UTC" ||
    !("updatedAt" in value) ||
    !isTimestamp(value.updatedAt)
  ) {
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

  return isSettingsInputValid(dto) ? dto : null;
}

function isTimestamp(value: unknown): value is string | null {
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

  const day = value.slice(0, 10);
  const midnight = Date.parse(`${day}T00:00:00.000Z`);

  return (
    Number.isFinite(midnight) &&
    new Date(midnight).toISOString().slice(0, 10) === day
  );
}
