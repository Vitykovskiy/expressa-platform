export const AVAILABILITY_ENDPOINT = "/api/v2/backoffice/availability";
export const AVAILABILITY_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const AVAILABILITY_MESSAGES = {
  readFailed: "Не удалось загрузить доступность. Обновите данные.",
  savedReadFailed:
    "Изменение сохранено. Не удалось обновить доступность. Обновите данные.",
  rejected: "Изменение не сохранено. Можно попробовать ещё раз.",
  unknown:
    "Не удалось узнать результат изменения. Проверяем текущее состояние.",
  checkFailed:
    "Исход изменения неизвестен. Обновите данные для проверки состояния.",
  reconciled:
    "Показано текущее состояние. Результат отправленной команды не подтверждён.",
} as const;

export const INTAKE_ENDPOINT = "/api/v2/backoffice/service/intake";
export const PRICE_CHOICE_AVAILABILITY_ENDPOINT =
  "/api/v3/backoffice/availability/price-choice";
