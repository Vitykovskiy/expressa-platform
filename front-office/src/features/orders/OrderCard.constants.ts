import type { CustomerOrderStage } from "@/shared/api/orders.api.types";

export const orderCardStageLabels = {
  CREATED: "Оформлен",
  ACCEPTED: "Заказ принят бариста",
  PREPARING: "Готовим заказ",
  READY: "Заказ готов к выдаче",
  ISSUED: "Заказ выдан",
} satisfies Record<CustomerOrderStage, string>;
