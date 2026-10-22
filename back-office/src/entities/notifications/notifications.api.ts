import { requestApi } from "../../shared/api/request";
import { PUSH_ENDPOINT, PUSH_UUID } from "./notifications.constants";
import type {
  PushCommand,
  PushInspection,
  PushOutcome,
  PushProof,
} from "./notifications.types";

export async function readPushKey(
  accessToken: string,
): Promise<PushOutcome<string>> {
  const result = await requestApi(`${PUSH_ENDPOINT}/public-key`, {
    method: "GET",
    accessToken,
  });

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "expired" };
  }

  if (
    result.kind !== "http" ||
    result.status !== 200 ||
    typeof result.body !== "object" ||
    result.body === null ||
    !("publicKey" in result.body) ||
    typeof result.body.publicKey !== "string"
  ) {
    return { kind: "unknown" };
  }

  return { kind: "confirmed", value: result.body.publicKey };
}

export async function inspectPush(
  accessToken: string,
  proof: PushProof,
): Promise<PushOutcome<PushInspection>> {
  const result = await requestApi(`${PUSH_ENDPOINT}/subscriptions/inspect`, {
    method: "POST",
    accessToken,
    body: proof,
  });

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "expired" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  if (result.status === 401 || result.status === 403) {
    return { kind: "expired" };
  }

  if (result.status !== 200) {
    return { kind: "unknown" };
  }

  const body = result.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("association" in body) ||
    !("version" in body)
  ) {
    return { kind: "unknown" };
  }

  if (
    body.association !== "none" &&
    body.association !== "other" &&
    body.association !== "current"
  ) {
    return { kind: "unknown" };
  }

  if (
    body.association === "none"
      ? body.version !== null
      : typeof body.version !== "string" || !PUSH_UUID.test(body.version)
  ) {
    return { kind: "unknown" };
  }

  return {
    kind: "confirmed",
    value: {
      association: body.association,
      version: typeof body.version === "string" ? body.version : null,
    },
  };
}

export async function changePush(
  accessToken: string,
  command: PushCommand,
): Promise<PushOutcome<string | null>> {
  const result = await requestApi(
    `${PUSH_ENDPOINT}/subscriptions/association`,
    {
      method: command.action === "disable" ? "DELETE" : "PUT",
      accessToken,
      body:
        command.action === "disable"
          ? {
              subscription: command.proof,
              expectedVersion: command.expectedVersion,
            }
          : {
              subscription: command.proof,
              expectedVersion: command.expectedVersion,
              action: "enable",
            },
    },
  );

  if (
    result.kind === "no-content" &&
    result.status === 204 &&
    command.action === "disable"
  ) {
    return { kind: "confirmed", value: null };
  }

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "expired" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  if (result.status === 400 || result.status === 409) {
    return { kind: "refused" };
  }

  const body = result.body;

  if (
    command.action === "enable" &&
    result.status === 200 &&
    typeof body === "object" &&
    body !== null &&
    "association" in body &&
    body.association === "current" &&
    "version" in body &&
    typeof body.version === "string" &&
    PUSH_UUID.test(body.version)
  ) {
    return { kind: "confirmed", value: body.version };
  }

  return { kind: "unknown" };
}
