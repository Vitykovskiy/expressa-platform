export type SlotOptionProps = {
  value: string;
  label: string;
  selected: boolean;
  available: boolean;
  disabled: boolean;
};

export type SlotOptionEmits = { select: [value: string] };
