export interface OperatingSettingsDto {
  readonly opensAt: string;
  readonly closesAt: string;
  readonly slotCapacity: number;
  readonly slotMinutes: 10;
  readonly timeZone: "UTC";
  readonly updatedAt: string | null;
}
