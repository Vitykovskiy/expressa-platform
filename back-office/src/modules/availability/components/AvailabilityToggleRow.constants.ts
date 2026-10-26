import type { AvailabilityCommand } from "../availability.types";

export const AVAILABILITY_COMMAND_STATUS: Readonly<
  Record<AvailabilityCommand["phase"], string>
> = {
  sending: "Сохраняем…",
  refreshing: "Обновляем доступность…",
  checking: "Проверяем текущее состояние…",
  unknown: "Исход изменения неизвестен",
};
