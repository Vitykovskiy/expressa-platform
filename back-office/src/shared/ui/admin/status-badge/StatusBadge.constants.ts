import type { OrderStatus } from "../Admin.types";
import type { StatusPresentation } from "./StatusBadge.types";

export const STATUS_PRESENTATION: Record<OrderStatus, StatusPresentation> = {
  Created: { label: "Оформлен", className: "status-badge--created" },
  Confirmed: { label: "Подтверждён", className: "status-badge--confirmed" },
  "Ready for pickup": { label: "Готов", className: "status-badge--ready" },
  Rejected: { label: "Отклонён", className: "status-badge--rejected" },
  Closed: { label: "Закрыт", className: "status-badge--closed" },
};
