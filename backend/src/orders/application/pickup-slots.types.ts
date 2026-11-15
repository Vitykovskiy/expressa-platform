import type { PickupSlot } from "../domain/order-metadata.types";

export type CustomerPickupSlots = {
  serviceDay: string;
  timeZone: "UTC";
  slotMinutes: 10;
  acceptsNewOrders: boolean;
  slots: readonly (PickupSlot & { available: boolean })[];
};

export interface PickupSlotsReader {
  readPickupSlots(): Promise<CustomerPickupSlots>;
}
