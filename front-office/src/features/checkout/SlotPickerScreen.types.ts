import type { PickupChoice } from "@/shared/api/pickup-slots.api.types";

export type SlotPickerScreenProps = {
  choices: PickupChoice[];
  selection: string | null;
  loading: boolean;
  busy: boolean;
  locked: boolean;
  canSubmit: boolean;
  message: string | null;
  notification: string | null;
};

export type SlotPickerScreenEmits = {
  select: [value: string];
  confirm: [];
  refresh: [];
  back: [];
  dismissNotification: [];
};
