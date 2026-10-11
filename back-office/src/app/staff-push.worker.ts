import {
  staffClickConfirmationType,
  staffClickType,
  staffOrderPattern,
} from "./staff-push.worker.constants";
import type {
  NotificationClickIntent,
  StaffWorkerHost,
} from "./staff-push.worker.types";

declare const self: StaffWorkerHost;

let epoch = self.crypto.randomUUID();
let sequence = 0;
let latest: NotificationClickIntent | null = null;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ownedURL(value: string) {
  try {
    const scope = new URL(self.registration.scope);
    const url = new URL(value);

    return (
      url.origin === scope.origin && url.pathname.startsWith(scope.pathname)
    );
  } catch {
    return false;
  }
}

async function handoff(intent: NotificationClickIntent) {
  const clients = (
    await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  ).filter((client) => ownedURL(client.url));
  const client =
    clients.find((item) => item.focused) ??
    clients.find((item) => item.visibilityState === "visible") ??
    clients[0];

  if (latest !== intent) return;
  if (client !== undefined) {
    client.postMessage(intent);
    await client.focus();

    return;
  }

  const target = new URL(self.registration.scope);

  target.searchParams.set("order", intent.orderId);
  await self.clients.openWindow(target.href);
}

self.addEventListener("push", (event) => {
  let payload: unknown;

  try {
    payload = event.data?.json();
  } catch {
    return;
  }

  if (
    !record(payload) ||
    typeof payload.title !== "string" ||
    payload.title.trim() === "" ||
    typeof payload.body !== "string" ||
    payload.body.trim() === "" ||
    typeof payload.orderId !== "string" ||
    !staffOrderPattern.test(payload.orderId)
  )
    return;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { orderId: payload.orderId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const data: unknown = event.notification.data;

  event.notification.close();
  if (
    !record(data) ||
    typeof data.orderId !== "string" ||
    !staffOrderPattern.test(data.orderId)
  )
    return;
  if (sequence === Number.MAX_SAFE_INTEGER) {
    epoch = self.crypto.randomUUID();
    sequence = 0;
  }

  sequence += 1;
  latest = { type: staffClickType, epoch, sequence, orderId: data.orderId };
  event.waitUntil(handoff(latest));
});

self.addEventListener("message", (event) => {
  const value: unknown = event.data;
  const port = event.ports[0];

  if (port === undefined) return;

  const confirmed =
    event.origin === new URL(self.registration.scope).origin &&
    event.source?.url !== undefined &&
    ownedURL(event.source.url) &&
    record(value) &&
    value.type === staffClickConfirmationType &&
    latest !== null &&
    value.epoch === latest.epoch &&
    value.sequence === latest.sequence &&
    value.orderId === latest.orderId;

  port.postMessage({ confirmed });
  port.close();
});
