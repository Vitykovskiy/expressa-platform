import { timingSafeEqual } from "node:crypto";
import {
  pushSubscriptionAuthLength,
  pushSubscriptionP256dhLength,
  pushSubscriptionP256dhPrefix,
} from "./push-subscription-proof.constants";
import type { PushSubscriptionProof } from "./push-subscription-proof.types";

export function hasPushSubscriptionProof(
  stored: PushSubscriptionProof,
  supplied: PushSubscriptionProof,
): boolean {
  const storedAuth = decodeBase64(stored.auth);
  const suppliedAuth = decodeBase64(supplied.auth);
  const storedPublicKey = decodeBase64(stored.p256dh);
  const suppliedPublicKey = decodeBase64(supplied.p256dh);

  return (
    stored.endpoint === supplied.endpoint &&
    isAuth(storedAuth) &&
    isAuth(suppliedAuth) &&
    isPublicKey(storedPublicKey) &&
    isPublicKey(suppliedPublicKey) &&
    equal(storedAuth, suppliedAuth) &&
    equal(storedPublicKey, suppliedPublicKey)
  );
}

export function isValidPushSubscriptionProof(
  proof: PushSubscriptionProof,
): boolean {
  return (
    isAuth(decodeBase64(proof.auth)) && isPublicKey(decodeBase64(proof.p256dh))
  );
}

function decodeBase64(value: string): Buffer | null {
  const match =
    /^(?<body>[A-Za-z0-9+/]+|[A-Za-z0-9_-]+)(?<padding>={0,2})$/.exec(value);
  if (match?.groups === undefined) return null;
  const body = match.groups.body;
  const padding = match.groups.padding;
  if (
    body === undefined ||
    padding === undefined ||
    !hasValidPadding(body, padding)
  )
    return null;
  const isUrl = /[-_]/.test(body);
  const standard = isUrl
    ? body.replaceAll("-", "+").replaceAll("_", "/")
    : body;
  try {
    const decoded = Buffer.from(standard, "base64");
    const canonical = isUrl
      ? decoded.toString("base64url")
      : decoded.toString("base64").replace(/=+$/, "");
    return canonical === body ? decoded : null;
  } catch {
    return null;
  }
}

function hasValidPadding(body: string, padding: string): boolean {
  const remainder = body.length % 4;
  if (remainder === 1) return false;
  const required = remainder === 0 ? 0 : 4 - remainder;
  return padding.length === 0 || padding.length === required;
}

function isAuth(value: Buffer | null): value is Buffer {
  return value !== null && value.length === pushSubscriptionAuthLength;
}

function isPublicKey(value: Buffer | null): value is Buffer {
  return (
    value !== null &&
    value.length === pushSubscriptionP256dhLength &&
    value[0] === pushSubscriptionP256dhPrefix
  );
}

function equal(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}
