import type { OperatingSettingsInput } from "../domain/operating-settings.types";
export type OperatingSettingsResponse = OperatingSettingsInput & {
  slotMinutes: 10;
  timeZone: "UTC";
  updatedAt: string | null;
};
export type OperatingSettingsRequest = { requestId?: unknown };
