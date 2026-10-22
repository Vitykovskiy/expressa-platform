export const SETTINGS_ENDPOINT = "/api/v3/backoffice/settings";
export const SETTINGS_TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export const SETTINGS_CAPACITY_PATTERN = /^[0-9]+$/;
export const SETTINGS_CAPACITY_MAX = 2147483647;
export const SETTINGS_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
export const SETTINGS_SAVED_VISIBLE_MS = 4000;

export const SETTINGS_MESSAGES = {
  readFailed: "Не удалось загрузить настройки. Попробуйте ещё раз.",
  stale:
    "Не удалось обновить настройки. Показаны ранее подтверждённые значения.",
  invalid:
    "Укажите время открытия раньше закрытия и целую вместимость от 1 до 2147483647.",
  rejected:
    "Настройки не сохранены. Проверьте время работы и вместимость слота.",
  notSent: "Не удалось отправить настройки. Попробуйте ещё раз.",
  unknown:
    "Ответ на сохранение не получен. Проверьте текущее состояние перед продолжением.",
  inspected:
    "Текущее состояние получено. Оно не подтверждает результат исходного сохранения.",
  inspectFailed:
    "Не удалось проверить текущее состояние. Сохранение не повторялось.",
  savedReadFailed:
    "Настройки сохранены, но обновить их текущее состояние не удалось.",
  changedAfterSave:
    "После сохранения настройки изменились. Показано текущее состояние.",
} as const;
