import type { TimeSlot } from "@/entities/customer/model/customer.types";

export interface SlotPickerScreenProps {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  loading?: boolean;
  errorMessage?: string;
}

export type SlotPickerScreenEmits = {
  selectSlot: [slotId: string];
  confirm: [slotId: string];
};
