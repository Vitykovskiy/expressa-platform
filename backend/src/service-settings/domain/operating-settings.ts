import type { OperatingSettingsInput } from "./operating-settings.types";

export class InvalidOperatingSettingsError extends Error {
  constructor() {
    super(
      "Укажите время открытия раньше закрытия и положительную целую вместимость.",
    );
  }
}

export function validateOperatingSettings(value: OperatingSettingsInput): void {
  if (
    !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value.opensAt) ||
    !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value.closesAt) ||
    value.opensAt >= value.closesAt ||
    !Number.isInteger(value.slotCapacity) ||
    value.slotCapacity < 1 ||
    value.slotCapacity > 2147483647
  ) {
    throw new InvalidOperatingSettingsError();
  }
}
