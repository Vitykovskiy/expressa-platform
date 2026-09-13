import type { PushSubscriptionRequest } from "@/shared/api/push.api";
import type { ApiClient } from "@/shared/api/client";

export type NotificationPresentationState =
  | "anonymous_off"
  | "anonymous_subscription"
  | "checking"
  | "denied"
  | "failed_check"
  | "failed_disable"
  | "failed_enable"
  | "off_current"
  | "on_current"
  | "other_account"
  | "unsupported";

export type NotificationOperation =
  "disable" | "enable" | "inspect" | "transfer" | null;

export type OrderNotificationsState = {
  accountId: string | null;
  accessToken: string | null;
  generation: number;
  operation: NotificationOperation;
  publicKey: string | null;
  state: NotificationPresentationState;
  subscription: PushSubscriptionRequest | null;
  version: string | null;
};

export type OrderNotificationsDependencies = {
  apiClient: ApiClient;
  readProtected<T>(read: (accessToken: string) => Promise<T>): Promise<T>;
};
