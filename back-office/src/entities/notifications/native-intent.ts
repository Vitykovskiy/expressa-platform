import { PUSH_UUID, PUSH_WORKER_PATH } from "./notifications.constants";
import {
  NATIVE_INTENT_PROTOCOL,
  NATIVE_INTENT_REPLY_TIMEOUT,
} from "./native-intent.constants";
import type {
  NativeIntentAction,
  NativeOrderIntent,
} from "./native-intent.types";

export function parseNativeViewChallenge(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "expressa-view-request" ||
    !("challenge" in value) ||
    typeof value.challenge !== "string" ||
    !PUSH_UUID.test(value.challenge)
  ) {
    return null;
  }

  return value.challenge;
}

export function parseNativeOrderIntent(
  value: unknown,
): NativeOrderIntent | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "expressa-order-click" ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !PUSH_UUID.test(value.id) ||
    !("orderId" in value) ||
    typeof value.orderId !== "string" ||
    !PUSH_UUID.test(value.orderId) ||
    !("lifetime" in value) ||
    typeof value.lifetime !== "string" ||
    !PUSH_UUID.test(value.lifetime) ||
    !("expiresAt" in value) ||
    typeof value.expiresAt !== "number" ||
    !Number.isSafeInteger(value.expiresAt) ||
    value.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    type: value.type,
    id: value.id,
    orderId: value.orderId,
    lifetime: value.lifetime,
    expiresAt: value.expiresAt,
  };
}

export async function currentIntentWorker(): Promise<globalThis.ServiceWorker | null> {
  if (!("serviceWorker" in globalThis.navigator)) {
    return null;
  }

  try {
    const registration =
      await globalThis.navigator.serviceWorker.getRegistration("/");
    const controller = globalThis.navigator.serviceWorker.controller;
    const expected = new globalThis.URL(
      PUSH_WORKER_PATH,
      globalThis.location.origin,
    );

    return registration?.active === controller &&
      controller?.state === "activated" &&
      controller.scriptURL === expected.href &&
      registration.scope === `${globalThis.location.origin}/`
      ? controller
      : null;
  } catch {
    return null;
  }
}

export function requestNativeIntent(
  worker: globalThis.ServiceWorker,
  action: NativeIntentAction,
  lifetime: string,
  intent: NativeOrderIntent | null = null,
): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new globalThis.MessageChannel();
    const timer = setTimeout(() => finish(false), NATIVE_INTENT_REPLY_TIMEOUT);

    function finish(accepted: boolean) {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(accepted);
    }

    channel.port1.onmessage = (event: globalThis.MessageEvent<unknown>) => {
      const data = event.data;

      finish(
        typeof data === "object" &&
          data !== null &&
          "accepted" in data &&
          data.accepted === true,
      );
    };

    try {
      worker.postMessage(
        { type: NATIVE_INTENT_PROTOCOL, action, lifetime, intent },
        [channel.port2],
      );
    } catch {
      finish(false);
    }
  });
}
