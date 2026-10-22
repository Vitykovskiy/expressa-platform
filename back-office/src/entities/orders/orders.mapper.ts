import type { OrderDto, OrderRecord } from "./orders.types";

export function toOrderRecord(dto: OrderDto): OrderRecord {
  return {
    id: dto.id,
    number: dto.number,
    createdAt: dto.createdAt,
    total: dto.total,
    stage: dto.stage,
    customerId: dto.customer.id,
    customerName: dto.customer.name,
    customerPhone: dto.customer.phoneE164,
    items: dto.snapshot,
    events: dto.events,
    pickupSlot: dto.pickupSlot,
    rejection: dto.rejection,
  };
}
