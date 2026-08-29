export enum OrderQueueStage {
  CREATED = "Оформлен",
  ACCEPTED = "Принят",
  PREPARING = "Готовится",
  READY = "Готов",
  ISSUED = "Выдан",
}

export enum OrderQueueFilter {
  ALL = "Все",
  CREATED = "Новые",
  ACCEPTED = "Приняты",
  PREPARING = "Готовятся",
  READY = "Готовы",
  ISSUED = "Выданы",
}

export enum OrderQueueTransitionAction {
  ACCEPT = "Принять заказ",
  START_PREPARING = "Начать приготовление",
  MARK_READY = "Отметить готовым",
  ISSUE = "Выдать заказ",
}

export interface OrderQueueDetails {
  readonly customer: string;
  readonly items: readonly string[];
}

export interface OrderQueueTransition {
  readonly from: OrderQueueStage;
  readonly to: OrderQueueStage;
  readonly occurredAt: string;
  /** Отображаемая UI-подпись сотрудника, выполнившего переход. */
  readonly author: string;
}
