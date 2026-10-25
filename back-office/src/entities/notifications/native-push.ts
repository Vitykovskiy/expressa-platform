import { PUSH_WORKER_PATH } from "./notifications.constants";
import type { PushProof } from "./notifications.types";
import {
  P256_PUBLIC_KEY_BYTES,
  P256_UNCOMPRESSED_POINT_PREFIX,
  VAPID_PUBLIC_KEY_PATTERN,
} from "./native-push.constants";

export function nativePushSupported() {
  return (
    globalThis.isSecureContext &&
    "serviceWorker" in globalThis.navigator &&
    "PushManager" in globalThis &&
    "Notification" in globalThis
  );
}

export async function prepareNativePush(publicKey: string) {
  if (!nativePushSupported() || !VAPID_PUBLIC_KEY_PATTERN.test(publicKey)) {
    return null;
  }

  try {
    const key = decodeVapidPublicKey(publicKey);

    if (key === null) {
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

function decodeVapidPublicKey(publicKey: string) {
  const base64 = publicKey.replace(/-/gu, "+").replace(/_/gu, "/");
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = globalThis.atob(paddedBase64);
  const key = Uint8Array.from(decoded, (character) => character.charCodeAt(0));

  if (
    key.length !== P256_PUBLIC_KEY_BYTES ||
    key[0] !== P256_UNCOMPRESSED_POINT_PREFIX
  ) {
    return null;
  }

  return key;
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
