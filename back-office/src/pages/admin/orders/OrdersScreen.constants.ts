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
    description: "Активные заказы появятся здесь",
    title: "Заказов нет",
  },
  search: {
    description: "Измените номер заказа или очистите поле поиска.",
    title: "Заказы не найдены",
  },
  stage: {
    description: "Выберите другую стадию, чтобы посмотреть заказы.",
    title: "В этой стадии пока нет заказов",
  },
  searchAndStage: {
    description: "Измените номер заказа или выберите другую стадию.",
    title: "Заказы не найдены",
  },
} as const;
