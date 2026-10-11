import type { NotificationView } from "../../entities/notification/notification.types";

export interface NotificationsProps {
  identity: string;
  section: string;
  view: NotificationView;
  busy: boolean;
}
export interface NotificationsEmits {
  read: [];
  enable: [];
  disable: [];
  finish: [];
  "open-change": [value: boolean];
}
