import { nativeBase64Pattern, nativePushTimeoutMs } from "./web-push.constants";
import type {
  NativePushOwner,
  NativePushProof,
  NativePushState,
} from "./web-push.types";

export function pushAvailable() {
  return (
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    "crypto" in window &&
    crypto.subtle !== undefined
  );
}

export function nativeRead<T>(
  flight: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => fail(), nativePushTimeoutMs);
    const abort = () => fail();

    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }

    function fail() {
      if (settled) return;

      settled = true;
      cleanup();
      reject(new Error("Native read unavailable"));
    }

    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) fail();
    flight.then((value) => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve(value);
    }, fail);
  });
}

export function decodePushKey(value: string) {
  if (!nativeBase64Pattern.test(value)) throw new Error("Invalid push key");

  const decoded = atob(value.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function validateServerKey(value: string, signal?: AbortSignal) {
  const bytes = decodePushKey(value);

  if (bytes.length !== 65 || bytes[0] !== 4)
    throw new Error("Invalid push key");

  await nativeRead(
    crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    ),
    signal,
  );

  return bytes;
}

function encodeKey(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function subscriptionProof(
  subscription: PushSubscription,
  signal?: AbortSignal,
): Promise<NativePushProof> {
  const endpoint = new URL(subscription.endpoint);
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (
    endpoint.protocol !== "https:" ||
    p256dh === null ||
    auth === null ||
    p256dh.byteLength !== 65 ||
    auth.byteLength !== 16
  )
    throw new Error("Invalid native subscription");

  await nativeRead(
    crypto.subtle.importKey(
      "raw",
      p256dh,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    ),
    signal,
  );

  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: encodeKey(p256dh), auth: encodeKey(auth) },
  };
}

export function sameProof(first: NativePushProof, second: NativePushProof) {
  return (
    first.endpoint === second.endpoint &&
    first.keys.p256dh === second.keys.p256dh &&
    first.keys.auth === second.keys.auth
  );
}

export function ownedActive(
  registration: ServiceWorkerRegistration,
  owner: NativePushOwner,
) {
  return (
    registration.scope === owner.scope &&
    registration.active?.scriptURL === owner.scriptURL &&
    registration.active.state === "activated"
  );
}

export function compatibleSubscription(
  subscription: PushSubscription,
  key: Uint8Array,
) {
  const actual = subscription.options.applicationServerKey;

  if (
    actual === null ||
    !subscription.options.userVisibleOnly ||
    (subscription.expirationTime !== null &&
      subscription.expirationTime <= Date.now())
  )
    return false;

  const bytes = new Uint8Array(actual);

  return (
    bytes.length === key.length &&
    bytes.every((byte, index) => byte === key[index])
  );
}

export async function readNativePush(
  owner: NativePushOwner,
  signal?: AbortSignal,
): Promise<NativePushState> {
  const registration = await nativeRead(
    navigator.serviceWorker.getRegistration(owner.scope),
    signal,
  );

  if (registration === undefined)
    return {
      registration: null,
      subscription: null,
      proof: null,
      permission: Notification.permission,
    };
  if (!ownedActive(registration, owner))
    throw new Error("Unowned native registration");

  const subscription = await nativeRead(
    registration.pushManager.getSubscription(),
    signal,
  );

  return {
    registration,
    subscription,
    proof:
      subscription === null
        ? null
        : await subscriptionProof(subscription, signal),
    permission: Notification.permission,
  };
}

export async function prepareNativePush(
  owner: NativePushOwner,
  signal?: AbortSignal,
) {
  const previous = await nativeRead(
    navigator.serviceWorker.getRegistration(owner.scope),
    signal,
  );

  if (
    previous !== undefined &&
    (previous.scope !== owner.scope ||
      [previous.active, previous.waiting, previous.installing].some(
        (worker) => worker !== null && worker.scriptURL !== owner.scriptURL,
      ))
  )
    throw new Error("Unowned native registration");

  const registration =
    previous ??
    (await nativeRead(
      navigator.serviceWorker.register(owner.scriptURL, {
        scope: owner.scope,
        type: "module",
      }),
      signal,
    ));

  if (!ownedActive(registration, owner)) {
    await new Promise<void>((resolve, reject) => {
      const workers = new Set<ServiceWorker>();
      let settled = false;
      const timer = setTimeout(() => settle(false), nativePushTimeoutMs);
      const abort = () => settle(false);

      function settle(ready: boolean) {
        if (settled) return;

        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        registration.removeEventListener("updatefound", inspect);
        for (const worker of workers)
          worker.removeEventListener("statechange", inspect);

        if (ready) resolve();
        else reject(new Error("Native worker not ready"));
      }

      function inspect() {
        if (settled) return;
        for (const worker of [
          registration.installing,
          registration.waiting,
          registration.active,
        ]) {
          if (worker !== null && !workers.has(worker)) {
            workers.add(worker);
            worker.addEventListener("statechange", inspect);
          }
        }

        if (ownedActive(registration, owner)) settle(true);
      }

      registration.addEventListener("updatefound", inspect);
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) settle(false);
      inspect();
    });
  }

  return readNativePush(owner, signal);
}
