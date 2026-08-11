import type { TimeSlot } from "@/entities/customer/model/customer.types";

export interface SlotOptionProps {
  timeSlot: TimeSlot;
  selected: boolean;
  disabled?: boolean;
}

export interface SlotOptionEmits {
  select: [slotId: string];
}
