import type { OrderLifecycleErrorCode } from './order-lifecycle.types';

export abstract class OrderLifecycleError extends Error {
  abstract readonly code: OrderLifecycleErrorCode;
}

export class OrderNotFoundError extends OrderLifecycleError {
  readonly code = 'ORDER_NOT_FOUND';
  constructor() { super('Заказ не найден.'); }
}

export class OrderStageConflictError extends OrderLifecycleError {
  readonly code = 'ORDER_STAGE_CONFLICT';
  constructor() { super('Переход заказа недопустим на текущей стадии.'); }
}
