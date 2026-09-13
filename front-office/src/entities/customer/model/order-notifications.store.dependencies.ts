import type { ApiClient } from "@/shared/api/client";
import type { OrderNotificationsDependencies } from "./order-notifications.store.types";

let dependencies: OrderNotificationsDependencies | undefined;

export function configureOrderNotificationsDependencies(
  apiClient: ApiClient,
  readProtected: OrderNotificationsDependencies["readProtected"],
): void {
  dependencies = { apiClient, readProtected };
}

export function getOrderNotificationsDependencies(): OrderNotificationsDependencies {
  if (dependencies === undefined)
    throw new Error("Notification dependencies are not configured.");
  return dependencies;
}
