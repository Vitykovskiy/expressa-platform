export const orderPageStageLabels = {
  CREATED: "Заказ принят",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} as const;

export const orderPageMessages = {
  unavailable: "Заказ недоступен.",
  loadFailed: "Не удалось загрузить заказ.",
  repeatImpossible: "Некоторые позиции больше недоступны:",
} as const;

export const orderPollingIntervalMs = 10_000;
