import type {
  OrderActionPresentation,
  OrderStagePresentationMap,
} from "./OrderCard.types";

export const orderStages: OrderStagePresentationMap = {
  ACCEPTED: { label: "Принят", tone: "info" },
  CREATED: { label: "Оформлен", tone: "warning" },
  ISSUED: { label: "Выдан", tone: "success" },
  PREPARING: { label: "Готовится", tone: "info" },
  READY: { label: "Готов", tone: "success" },
};

export const orderActions: Partial<
  Record<keyof typeof orderStages, OrderActionPresentation>
> = {
  ACCEPTED: { label: "Начать приготовление" },
  CREATED: { label: "Принять заказ" },
  PREPARING: { label: "Отметить готовым" },
  READY: { label: "Выдать заказ" },
};
