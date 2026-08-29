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
  intakeClosed: "ORDER_INTAKE_CLOSED",
  invalidCart: "INVALID_CART",
  itemUnavailable: "MENU_ITEM_UNAVAILABLE",
  network: "NETWORK_ERROR",
  totalChanged: "ORDER_TOTAL_CHANGED",
  unknown: "UNKNOWN_ERROR",
} as const;

export const checkoutMessages = {
  dependenciesNotConfigured: "Зависимости оформления не настроены.",
  intakeClosed: "Приём новых заказов сейчас закрыт.",
  invalidCart: "Корзина содержит позиции, которые нельзя оформить.",
  itemUnavailable: "Одна или несколько позиций больше недоступны.",
  orderFailed: "Не удалось оформить заказ.",
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
