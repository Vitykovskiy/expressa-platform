import type { OrderCardActionPresentationMap } from "./OrderCard.types";

export const ORDER_CARD_ACTIONS: OrderCardActionPresentationMap = {
  Created: [
    { action: "confirm", label: "Подтвердить" },
    { action: "reject", label: "Отклонить", variant: "destructive" },
  ],
  Confirmed: [{ action: "ready", label: "Готово к выдаче" }],
  "Ready for pickup": [
    { action: "close", label: "Выдан", variant: "secondary" },
  ],
  Rejected: [],
  Closed: [],
};
