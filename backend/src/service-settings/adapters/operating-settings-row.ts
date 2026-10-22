import type { OperatingSettings } from "../domain/operating-settings.types";
import { validateOperatingSettings } from "../domain/operating-settings";
import type { OperatingSettingsDatabaseRow } from "./postgres-operating-settings.repository.types";
export function readOperatingSettings(
  rows: OperatingSettingsDatabaseRow[],
): OperatingSettings {
  const row = rows[0];
  if (
    rows.length !== 1 ||
    row === undefined ||
    typeof row.opens_at !== "string" ||
    typeof row.closes_at !== "string" ||
    typeof row.slot_capacity !== "number" ||
    (row.updated_at !== null &&
      (!(row.updated_at instanceof Date) ||
        Number.isNaN(row.updated_at.getTime())))
  ) {
    throw new Error("Invalid PostgreSQL operating settings");
  }
  const settings = {
    opensAt: readMinuteTime(row.opens_at),
    closesAt: readMinuteTime(row.closes_at),
    slotCapacity: row.slot_capacity,
  };
  try {
    validateOperatingSettings(settings);
  } catch (error) {
    throw new Error("Invalid persisted operating settings", { cause: error });
  }
  return {
    ...settings,
    slotMinutes: 10,
    timeZone: "UTC",
    updatedAt: row.updated_at,
  };
}
function readMinuteTime(value: string): string {
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]:00$/.test(value)) {
    throw new Error("Invalid PostgreSQL operating time precision");
  }
  return value.slice(0, 5);
}
