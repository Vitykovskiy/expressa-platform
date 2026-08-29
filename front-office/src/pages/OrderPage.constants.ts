export const orderPageStageLabels = {
  CREATED: "Оформлен",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} as const;

export const orderPageMessages = {
  pushDisabled: "Уведомления отключены.",
  pushFailed: "Не удалось изменить уведомления. Заказ останется доступен.",
  pushUnsupported: "Уведомления не поддерживаются этим браузером.",
  unavailable: "Заказ недоступен.",
  loadFailed: "Не удалось загрузить заказ.",
  repeatProductUnavailable: "Товар больше недоступен.",
  repeatConfigurationUnavailable: "Выбранная конфигурация больше недоступна.",
} as const;

export const orderPollingIntervalMs = 10_000;
