export type PickupSlotDto = { startsAt: string; endsAt: string };
export type OrderRejectionDto = { reason: string; at: string; actorId: string };
export type OrderMetadataDto = {
  pickupSlot?: PickupSlotDto | null;
  rejection?: OrderRejectionDto | null;
};
export type SourceOrderRequest = { requestId?: unknown };
