import type { OrderNotificationsState } from "./order-notifications.store.types";

export const initialOrderNotificationsState: OrderNotificationsState = {
  accountId: null,
  accessToken: null,
  generation: 0,
  operation: null,
  publicKey: null,
  state: "checking",
  subscription: null,
  version: null,
};

export const orderNotificationsMessages = {
  failedDisable:
    "Не удалось отключить уведомления на этом устройстве. Попробуйте ещё раз.",
  failedEnable: "Не удалось включить уведомления. Попробуйте ещё раз.",
  failedInspection: "Не удалось проверить уведомления. Попробуйте ещё раз.",
} as const;
