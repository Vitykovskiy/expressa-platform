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

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "unknown" };
  }

  const body = result.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("publicKey" in body) ||
    typeof body.publicKey !== "string"
  ) {
    return { kind: "unknown" };
  }

  return { kind: "confirmed", value: body.publicKey };
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

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "unknown" };
  }

  const inspection = parsePushInspection(result.body);

  if (inspection === null) {
    return { kind: "unknown" };
  }

  return { kind: "confirmed", value: inspection };
}

function parsePushInspection(body: unknown): PushInspection | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("association" in body) ||
    !("version" in body)
  ) {
    return null;
  }

  if (
    body.association !== "none" &&
    body.association !== "other" &&
    body.association !== "current"
  ) {
    return null;
  }

  if (body.association === "none") {
    if (body.version !== null) {
      return null;
    }

    return { association: body.association, version: null };
  }

  if (typeof body.version !== "string" || !PUSH_UUID.test(body.version)) {
    return null;
  }

  return { association: body.association, version: body.version };
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

  if (command.action !== "enable" || result.status !== 200) {
    return { kind: "unknown" };
  }

  const body = result.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("association" in body) ||
    body.association !== "current"
  ) {
    return { kind: "unknown" };
  }

  if (
    !("version" in body) ||
    typeof body.version !== "string" ||
    !PUSH_UUID.test(body.version)
  ) {
    return { kind: "unknown" };
  }

  return { kind: "confirmed", value: body.version };
}
