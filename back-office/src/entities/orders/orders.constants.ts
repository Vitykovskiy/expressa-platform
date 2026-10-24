import type { OrderStage, OrdersView, OrderAction } from "./orders.types";

export const ORDERS_ENDPOINT = "/api/v3/backoffice/orders";
export const ORDERS_POLL_INTERVAL = 5000;
export const ORDER_SLOT_DURATION = 600000;
export const ORDER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ORDER_PHONE = /^\+[1-9]\d{6,14}$/;
export const ORDER_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
export const ORDER_STAGES: readonly OrderStage[] = [
  "CREATED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ISSUED",
];
export const ORDER_STAGE_INDEX = {
  CREATED: 0,
  ACCEPTED: 1,
  PREPARING: 2,
  READY: 3,
  ISSUED: 4,
} as const;
export const ORDER_STAGE_LABELS = {
  CREATED: "Новый",
  ACCEPTED: "Подтверждён",
  PREPARING: "Готовится",
  READY: "Готов",
  ISSUED: "Выдан",
} as const;
export const ORDER_STAGE_VIEWS: Readonly<Record<OrderStage, OrdersView>> = {
  CREATED: "new",
  ACCEPTED: "confirmed",
  PREPARING: "confirmed",
  READY: "ready",
  ISSUED: "all",
};
export const ORDER_ACTION_STAGES: Readonly<Record<OrderAction, OrderStage>> = {
  accept: "ACCEPTED",
  ready: "READY",
  reject: "CREATED",
  issue: "ISSUED",
};
export const ORDER_ACTION_PATHS = {
  accept: "/api/v2/backoffice/orders",
  ready: ORDERS_ENDPOINT,
  reject: ORDERS_ENDPOINT,
  issue: "/api/v2/backoffice/orders",
} as const;
export const ORDER_ACTION_ALLOWED_STAGES: Readonly<
  Record<OrderAction, readonly OrderStage[]>
> = {
  accept: ["CREATED"],
  reject: ["CREATED"],
  ready: ["ACCEPTED", "PREPARING"],
  issue: ["READY"],
};
export const ORDER_MESSAGES = {
  rejectionFailed: "Не удалось отклонить заказ. Попробуйте ещё раз.",
  rejectionNoResponse: "Не удалось получить ответ.",
  readFailed:
    "Не удалось обновить заказы. Показаны последние полученные данные.",
  detailFailed: "Не удалось загрузить заказ. Можно повторить чтение.",
  notFound: "Заказ не найден.",
  invalidAddress:
    "Неверный адрес заказа. Исправьте параметры number, stage или order.",
  commandRejected:
    "Изменение не выполнено. Проверьте заказ и повторите действие.",
  conflict: "Заказ уже изменился. Загружаем его текущее состояние.",
  unknown:
    "Результат команды неизвестен. Команда не будет отправлена повторно. Проверьте текущее состояние заказа.",
  checkingFailed:
    "Не удалось проверить заказ. Команда остаётся заблокированной; повторите только чтение.",
  reconciled:
    "Показано текущее состояние заказа. Результат отправленной команды не подтверждён.",
  confirmed: "Заказ обновлён.",
  missingName: "Без имени",
  missingPickup: "Время не задано",
} as const;
