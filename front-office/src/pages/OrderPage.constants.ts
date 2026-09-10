export const orderPageStageLabels = {
  CREATED: "Оформлен",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} as const;

export const orderPageStageHints = {
  CREATED: "Ожидаем подтверждения бариста.",
  ACCEPTED: "Бариста принял заказ.",
  PREPARING: "Готовим заказ.",
  READY: "Можно забрать заказ на кассе.",
  ISSUED: "Заказ выдан.",
} as const;

export const orderPageMessages = {
  pushDisabled: "Уведомления отключены.",
  pushFailed: "Не удалось изменить уведомления. Заказ останется доступен.",
  pushPreparing: "Проверяем уведомления…",
  pushUnsupported: "Уведомления не поддерживаются этим браузером.",
  unavailable: "Заказ недоступен.",
  loadFailed: "Не удалось загрузить заказ.",
  refreshing: "Обновляем заказ",
  refreshFailed: "Не удалось обновить заказ.",
  repeatPreparing: "Проверяем доступность позиций…",
  staleData: "Показаны последние доступные данные.",
  repeatProductUnavailable: "Товар больше недоступен.",
  repeatConfigurationUnavailable: "Выбранная конфигурация больше недоступна.",
} as const;

export const orderPollingIntervalMs = 10_000;
