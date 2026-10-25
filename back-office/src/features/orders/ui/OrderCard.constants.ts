import type { OrderPresentationStage } from "./OrderCard.types";

export const ORDER_STAGE_LABELS = {
  created: "Новый",
  confirmed: "Подтверждён",
  ready: "Готов",
  rejected: "Отклонён",
  closed: "Выдан",
} as const satisfies Readonly<Record<OrderPresentationStage, string>>;

export const ORDER_CLOCK_ICON = "/orders/clock.svg";
