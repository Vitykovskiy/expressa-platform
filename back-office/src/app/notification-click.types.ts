import type { NativePushOwner } from "../shared/browser/web-push.types";
import type { NotificationClickIntent } from "./staff-push.worker.types";

export interface NotificationClickOptions {
  owner: NativePushOwner;
  interaction: () => number;
  lifetime: () => number;
  receive: (intent: NotificationClickIntent, intervened: boolean) => void;
}
export interface ClickReceipt {
  intent: NotificationClickIntent;
  source: ServiceWorker;
}
