export enum OrderHistoryStatus {
  CREATED = "Оформлен",
  ACCEPTED = "Заказ принят бариста",
  PREPARING = "Готовим заказ",
  READY = "Заказ готов к выдаче",
  ISSUED = "Заказ выдан",
}

export interface OrderHistoryEntry {
  readonly number: string;
  readonly displayedDate: string;
  readonly total: string;
  readonly status: OrderHistoryStatus;
}
