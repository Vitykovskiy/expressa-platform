import { PUSH_WORKER_PATH } from "./notifications.constants";
import type { PushProof } from "./notifications.types";

export function nativePushSupported() {
  return (
    globalThis.isSecureContext &&
    "serviceWorker" in globalThis.navigator &&
    "PushManager" in globalThis &&
    "Notification" in globalThis
  );
}

export async function prepareNativePush(publicKey: string) {
  if (!nativePushSupported() || !/^[A-Za-z0-9_-]+$/u.test(publicKey)) {
    return null;
  }

  try {
    const base64 = publicKey.replace(/-/gu, "+").replace(/_/gu, "/");
    const decoded = globalThis.atob(
      base64.padEnd(Math.ceil(base64.length / 4) * 4, "="),
    );
    const key = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0),
    );

    if (key.length !== 65 || key[0] !== 4) {
      return null;
    }

    await globalThis.crypto.subtle.importKey(
      "raw",
      key,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
    const registration = await globalThis.navigator.serviceWorker.register(
      PUSH_WORKER_PATH,
      { scope: "/" },
    );

    await globalThis.navigator.serviceWorker.ready;

    return { registration, key };
  } catch {
    return null;
  }
}

export function nativePushProof(
  subscription: globalThis.PushSubscription,
): PushProof | null {
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://") ||
    typeof p256dh !== "string" ||
    typeof auth !== "string"
  ) {
    return null;
  }

  return { endpoint, keys: { p256dh, auth } };
}
