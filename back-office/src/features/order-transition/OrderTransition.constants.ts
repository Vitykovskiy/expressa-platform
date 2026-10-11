import type { OrderAction } from "../../entities/order/order.types";

export const orderActionCopy: Record<
  OrderAction,
  { label: string; pending: string; completion: string }
> = {
  accept: {
    label: "Принять заказ",
    pending: "Принимаем заказ",
    completion: "Заказ принят",
  },
  startPreparing: {
    label: "Начать приготовление",
    pending: "Начинаем приготовление",
    completion: "Приготовление начато",
  },
  markReady: {
    label: "Отметить готовым",
    pending: "Отмечаем готовность",
    completion: "Заказ готов",
  },
  issue: {
    label: "Оплачен на кассе — выдать",
    pending: "Выдаём заказ",
    completion: "Заказ выдан",
  },
};
