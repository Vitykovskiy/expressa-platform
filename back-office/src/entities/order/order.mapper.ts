import type { Order, OrderDto } from "./order.types";

export function mapOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    number: dto.number,
    createdAt: dto.createdAt,
    total: dto.total,
    stage: dto.stage,
    customerId: dto.customer.id,
    customerPhone: dto.customer.phoneE164,
    items: dto.snapshot.map((item) => ({
      productId: item.productId,
      priceChoiceId: item.priceChoiceId,
      name: item.productName,
      portion: item.portionLabel,
      quantity: item.quantity,
      unitTotal: item.unitTotal,
      lineTotal: item.lineTotal,
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.modifierOptionId,
        name: modifier.modifierName,
        priceDelta: modifier.priceDelta,
      })),
    })),
    events: dto.events.map((event) => ({
      actorId: event.actorId,
      actorPhone: event.actorLabel,
      occurredAt: event.occurredAt,
      from: event.from,
      to: event.to,
    })),
  };
}
