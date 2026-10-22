import type { OrderMetadata } from "../domain/order-metadata.types";
import type { OrderMetadataDto } from "./order-metadata.dto.types";

export function toOrderMetadataDto(
  order: OrderMetadata,
): Required<OrderMetadataDto> {
  return {
    pickupSlot:
      order.pickupSlot == null
        ? null
        : {
            startsAt: order.pickupSlot.startsAt.toISOString(),
            endsAt: order.pickupSlot.endsAt.toISOString(),
          },
    rejection:
      order.rejection == null
        ? null
        : { ...order.rejection, at: order.rejection.at.toISOString() },
  };
}
