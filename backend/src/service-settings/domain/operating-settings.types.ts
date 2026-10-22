export type OperatingSettingsInput = {
  opensAt: string;
  closesAt: string;
  slotCapacity: number;
};
export type OperatingSettings = OperatingSettingsInput & {
  slotMinutes: 10;
  timeZone: "UTC";
  updatedAt: Date | null;
};
