import type { CustomerOrderStage } from "@/shared/api/orders.api.types";

export const orderCardStageLabels = {
  CREATED: "Оформлен",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} satisfies Record<CustomerOrderStage, string>;

export const orderCardStageHints = {
  CREATED: "Ожидаем подтверждения бариста.",
  ACCEPTED: "Бариста принял заказ.",
  PREPARING: "Готовим заказ.",
  READY: "Можно забрать заказ на кассе.",
  ISSUED: "Заказ выдан.",
} satisfies Record<CustomerOrderStage, string>;
