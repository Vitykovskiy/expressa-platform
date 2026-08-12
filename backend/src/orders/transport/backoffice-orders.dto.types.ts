import type { OrderStage } from '../domain/order-lifecycle.types';
import type { OrderItemDto } from './order.dto.types';

export type BackofficeOrderEventDto = { actorId: string; occurredAt: string; from: OrderStage; to: OrderStage };
export type BackofficeOrderListItemDto = { id: string; number: string; createdAt: string; totalMinor: number; stage: OrderStage };
export type BackofficeOrderDetailsDto = BackofficeOrderListItemDto & { customer: { id: string; phoneE164: string }; snapshot: readonly OrderItemDto[]; events: readonly BackofficeOrderEventDto[] };
