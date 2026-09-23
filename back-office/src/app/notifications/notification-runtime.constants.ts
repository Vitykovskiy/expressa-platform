import type { OperationVisibility } from "../../shared/lib/operations/operation.types";

export const notificationLifetimeMs = 5_000;
export const notificationTickMs = 100;
export const narrowNotificationViewport = 768;

export const defaultNotificationVisibility: OperationVisibility = {
  availableHeight: Number.POSITIVE_INFINITY,
  hidden: false,
  hoveredId: null,
  stackFits: true,
  viewportWidth: narrowNotificationViewport,
};
