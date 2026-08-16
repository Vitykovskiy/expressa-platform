/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

import type { OrderNotification } from "./push-notifications.types";

declare let self: ServiceWorkerGlobalScope;

if (isServiceWorker()) {
  precacheAndRoute(self.__WB_MANIFEST);
  self.addEventListener("push", (event) => {
    const notification = toOrderNotification(event.data?.json());
    if (notification === null) return;

    event.waitUntil(
      self.registration.showNotification(notification.title, {
        body: notification.body,
        data: { orderId: notification.orderId },
      }),
    );
  });
  self.addEventListener("notificationclick", (event) => {
    const orderUrl = toOrderUrl(event.notification.data);
    event.notification.close();
    if (orderUrl === null) return;

    event.waitUntil(self.clients.openWindow(orderUrl));
  });
}

export function toOrderUrl(value: unknown): string | null {
  if (!isRecord(value) || !isUuid(value.orderId)) return null;

  return `/orders/${value.orderId}`;
}

function isServiceWorker(): boolean {
  return "clients" in globalThis && "registration" in globalThis;
}

function toOrderNotification(value: unknown): OrderNotification | null {
  if (
    !isRecord(value) ||
    typeof value.title !== "string" ||
    typeof value.body !== "string" ||
    !isUuid(value.orderId)
  ) {
    return null;
  }

  return { body: value.body, orderId: value.orderId, title: value.title };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
