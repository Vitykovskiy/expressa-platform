import { HttpStatus } from '@nestjs/common';

export const ordersControllerPath = 'orders';
export const ordersApiTag = 'orders';
export const idempotencyHeaderName = 'Idempotency-Key';
export const idempotencyHeaderRequestKey = 'idempotency-key';
export const idempotencyHeaderDescription = 'UUID-ключ идемпотентности запроса.';
export const idempotencyHeaderSchema = { type: 'string', format: 'uuid' } as const;
export const maximumOrderTotalMinor = 2_147_483_647;

export const orderErrorResponses = {
  intakeClosed: {
    code: 'ORDER_INTAKE_CLOSED',
    message: 'Приём новых заказов выключен.',
    details: null,
  },
  totalChanged: (totalMinor: number) => ({
    code: 'ORDER_TOTAL_CHANGED',
    message: 'Итоговая сумма заказа изменилась.',
    details: { totalMinor },
  }),
  unavailable: (itemId: string) => ({
    code: 'MENU_ITEM_UNAVAILABLE',
    message: 'Позиция меню недоступна.',
    details: { itemId },
  }),
  validation: {
    code: 'VALIDATION_ERROR',
    message: 'Состав заказа недопустим.',
    details: null,
  },
} as const;

export const orderErrorStatus = HttpStatus.BAD_REQUEST;
export const idempotencyKeyReusedStatus = HttpStatus.CONFLICT;
