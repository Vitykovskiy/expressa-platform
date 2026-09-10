export const orderPageStageLabels = {
  CREATED: "Оформлен",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} as const;

export const orderPageMessages = {
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
