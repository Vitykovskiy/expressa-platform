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
    title: "Заказов нет",
  },
  search: {
    title: "Заказы не найдены",
  },
  stage: {
    title: "Заказы не найдены",
  },
  searchAndStage: {
    title: "Заказы не найдены",
  },
} as const;
