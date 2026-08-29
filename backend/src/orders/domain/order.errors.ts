import type { OrderErrorCode } from './order.types';

export abstract class OrderDomainError extends Error {
  abstract readonly code: OrderErrorCode;
}

export class OrderIntakeClosedError extends OrderDomainError {
  readonly code = 'ORDER_INTAKE_CLOSED';

  constructor() {
    super('Приём новых заказов выключен.');
  }
}

export class OrderValidationError extends OrderDomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor() {
    super('Состав заказа недопустим.');
  }
}

export class MenuItemUnavailableError extends OrderDomainError {
  readonly code = 'MENU_ITEM_UNAVAILABLE';

  constructor(readonly itemId: string) {
    super('Позиция меню недоступна.');
  }
}

export class OrderTotalChangedError extends OrderDomainError {
  readonly code = 'ORDER_TOTAL_CHANGED';

  constructor(readonly total: number) {
    super('Итоговая сумма заказа изменилась.');
  }
}

export class IdempotencyKeyReusedError extends OrderDomainError {
  readonly code = 'IDEMPOTENCY_KEY_REUSED';
  constructor() { super('Ключ идемпотентности уже использован с другим запросом.'); }
}
