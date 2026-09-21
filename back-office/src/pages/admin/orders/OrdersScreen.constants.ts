import type { QueueFilter } from "./OrdersScreen.types";

export const queueFilters: readonly { label: string; value: QueueFilter }[] = [
  { label: "Все", value: "ALL" },
  { label: "Новые", value: "CREATED" },
  { label: "Приняты", value: "ACCEPTED" },
  { label: "Готовятся", value: "PREPARING" },
  { label: "Готовы", value: "READY" },
  { label: "Выданы", value: "ISSUED" },
];

export const queueEmptyContent = {
  global: {
    description: "Новые заказы появятся здесь.",
    title: "Заказов нет",
  },
  search: {
    description: "Измените номер заказа или фильтр.",
    title: "Заказы не найдены",
  },
  stage: {
    description: "Измените номер заказа или фильтр.",
    title: "Заказы не найдены",
  },
  searchAndStage: {
    description: "Измените номер заказа или выберите другую стадию.",
    title: "Заказы не найдены",
  },
} as const;
