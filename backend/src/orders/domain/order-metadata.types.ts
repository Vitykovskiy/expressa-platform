export type PickupSlot = { startsAt: Date; endsAt: Date };
export type OrderRejection = { reason: string; at: Date; actorId: string };
export type OrderMetadata = {
  pickupSlot?: PickupSlot | null;
  rejection?: OrderRejection | null;
};
export type OrderQueueView = "all" | "new" | "confirmed" | "ready";
