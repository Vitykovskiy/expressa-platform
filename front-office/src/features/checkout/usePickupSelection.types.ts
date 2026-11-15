import type { ComputedRef } from "vue";
import type { PickupAvailability } from "@/shared/api/pickup-slots.api.types";

export type PickupSelectionDependencies = {
  loadAvailability(): Promise<PickupAvailability>;
  locked: ComputedRef<boolean>;
};
