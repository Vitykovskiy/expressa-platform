import { contractFailure, isRecord, request } from "../../shared/api/transport";
import type { NativePushProof } from "../../shared/browser/web-push.types";
import { associationVersionPattern } from "./notification.constants";
import type { PushAssociation } from "./notification.types";

function parseAssociation(value: unknown): PushAssociation {
  if (
    !isRecord(value) ||
    (value.association !== "none" &&
      value.association !== "current" &&
      value.association !== "other") ||
    (value.association === "none"
      ? value.version !== null
      : typeof value.version !== "string" ||
        !associationVersionPattern.test(value.version))
  )
    return contractFailure();

  return {
    association: value.association as PushAssociation["association"],
    version: value.version as string | null,
  };
}

export async function readPublicKey(token: string) {
  const value = await request("/api/v2/push/public-key", {
    token,
    expectedStatus: 200,
  });

  if (!isRecord(value) || typeof value.publicKey !== "string")
    return contractFailure();

  return value.publicKey;
}

export async function inspectAssociation(
  token: string,
  proof: NativePushProof,
) {
  return parseAssociation(
    await request("/api/v2/push/subscriptions/inspect", {
      token,
      method: "POST",
      body: proof,
      expectedStatus: 200,
    }),
  );
}

export async function enableAssociation(token: string, proof: NativePushProof) {
  const result = parseAssociation(
    await request("/api/v2/push/subscriptions/association", {
      token,
      method: "PUT",
      body: { subscription: proof, action: "enable", expectedVersion: null },
      expectedStatus: 200,
    }),
  );

  if (result.association !== "current") return contractFailure();

  return result;
}

export async function disableAssociation(
  token: string,
  proof: NativePushProof,
  version: string,
) {
  await request("/api/v2/push/subscriptions/association", {
    token,
    method: "DELETE",
    body: { subscription: proof, expectedVersion: version },
    expectedStatus: 204,
  });
}
