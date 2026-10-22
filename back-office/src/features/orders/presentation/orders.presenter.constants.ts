import type { OrderStage } from "../../../entities/orders/orders.types";
import type { OrderPresentationStage } from "./OrderCard.types";

export const SOURCE_ORDER_STAGES: Readonly<
  Record<OrderStage, OrderPresentationStage>
> = {
  CREATED: "created",
  ACCEPTED: "confirmed",
  PREPARING: "confirmed",
  READY: "ready",
  ISSUED: "closed",
};
export const ORDER_TIME_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
export const ORDER_DATE_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
