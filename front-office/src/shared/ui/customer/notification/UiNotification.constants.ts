import type { UiNotificationProps } from "./UiNotification.types";

export const UI_NOTIFICATION_DURATION_MS = 4000;
export const UI_NOTIFICATION_DEFAULTS = {
  role: "status",
} satisfies Required<Pick<UiNotificationProps, "role">>;
