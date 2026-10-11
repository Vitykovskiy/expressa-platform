export interface NotificationClickIntent {
  type: "expressa-staff-order-click";
  epoch: string;
  sequence: number;
  orderId: string;
}
export interface WorkerWindow {
  url: string;
  focused: boolean;
  visibilityState: string;
  postMessage(message: NotificationClickIntent): void;
  focus(): Promise<unknown>;
}
export interface StaffWorkerHost {
  crypto: Crypto;
  registration: {
    scope: string;
    showNotification(
      title: string,
      options: NotificationOptions,
    ): Promise<void>;
  };
  clients: {
    matchAll(options: {
      type: "window";
      includeUncontrolled: boolean;
    }): Promise<WorkerWindow[]>;
    openWindow(url: string): Promise<unknown>;
  };
  addEventListener(
    type: "push",
    listener: (event: {
      data: { json(): unknown } | null;
      waitUntil(flight: Promise<unknown>): void;
    }) => void,
  ): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: {
      notification: { data: unknown; close(): void };
      waitUntil(flight: Promise<unknown>): void;
    }) => void,
  ): void;
  addEventListener(
    type: "message",
    listener: (event: {
      data: unknown;
      origin: string;
      source: { url?: string } | null;
      ports: readonly MessagePort[];
    }) => void,
  ): void;
}
