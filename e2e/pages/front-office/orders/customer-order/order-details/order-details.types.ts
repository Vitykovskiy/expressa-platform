export enum OrderPaymentMethod {
  CASH_ON_PICKUP = "Оплата на кассе при получении",
}

export enum OrderStatus {
  CREATED = "Оформлен",
  ACCEPTED = "Заказ принят бариста",
  PREPARING = "Готовим заказ",
  READY = "Заказ готов к выдаче",
  ISSUED = "Заказ выдан",
}
