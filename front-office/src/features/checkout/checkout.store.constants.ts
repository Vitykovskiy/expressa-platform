import type { CheckoutState } from "./checkout.store.types";

export const checkoutStoreId = "checkout";

export const checkoutStatuses = {
  error: "error",
  idle: "idle",
  reconfirmationRequired: "reconfirmation-required",
  submitting: "submitting",
  succeeded: "succeeded",
} as const;

export const checkoutErrorCodes = {
  capacityUnavailable: "ORDER_CAPACITY_UNAVAILABLE",
  intakeClosed: "ORDER_INTAKE_CLOSED",
  invalidCart: "INVALID_CART",
  itemUnavailable: "MENU_ITEM_UNAVAILABLE",
  network: "NETWORK_ERROR",
  totalChanged: "ORDER_TOTAL_CHANGED",
  unknown: "UNKNOWN_ERROR",
} as const;

export const checkoutMessages = {
  capacityUnavailable:
    "На сегодня нет свободного времени для получения заказа. Заказ не создан, корзина сохранена. Вернитесь к оформлению в другой рабочий день.",
  dependenciesNotConfigured: "Зависимости оформления не настроены.",
  intakeClosed: "Приём новых заказов сейчас закрыт.",
  invalidCart: "Корзина содержит позиции, которые нельзя оформить.",
  itemUnavailable: "Одна или несколько позиций больше недоступны.",
  orderFailed: "Сервис временно недоступен. Повторите оформление заказа.",
  retryFailed: "Не удалось отправить заказ. Повторите попытку.",
  totalChanged: "Итог заказа изменился. Подтвердите заказ ещё раз.",
} as const;

export const initialCheckoutState: CheckoutState = {
  attempt: null,
  errorCode: null,
  errorMessage: null,
  order: null,
  reconfirmedTotal: null,
  status: checkoutStatuses.idle,
  submitPromise: null,
  unavailableCartItemIds: [],
};
