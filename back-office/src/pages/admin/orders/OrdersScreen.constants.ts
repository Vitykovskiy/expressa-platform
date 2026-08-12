import type { QueueFilter } from "./OrdersScreen.types";

export const queueFilters: readonly { label: string; value: QueueFilter }[] = [
  { label: "Все", value: "ALL" },
  { label: "Новые", value: "CREATED" },
  { label: "Приняты", value: "ACCEPTED" },
  { label: "Готовятся", value: "PREPARING" },
  { label: "Готовы", value: "READY" },
  { label: "Выданы", value: "ISSUED" },
];
