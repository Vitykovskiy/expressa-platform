export enum OrderQueueStage {
  CREATED = "Новый",
  ACCEPTED = "Принят",
  PREPARING = "Готовится",
  READY = "Готов к выдаче",
  ISSUED = "Выдан",
}

export interface OrderQueueTransition {
  from: OrderQueueStage;
  to: OrderQueueStage;
}
