export type PickupChoice = {
  startsAt: string;
  label: string;
  available: boolean;
};

export type PickupAvailability = {
  serviceDay: string;
  acceptsNewOrders: boolean;
  choices: PickupChoice[];
};

export type PickupSlotsResponse = {
  serviceDay: string;
  timeZone: "UTC";
  slotMinutes: 10;
  acceptsNewOrders: boolean;
  slots: { startsAt: string; endsAt: string; available: boolean }[];
};
