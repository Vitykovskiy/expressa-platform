import {
  apiContractErrorCode,
  apiResponseContractErrorMessage,
} from "./client.constants";
import { ApiError } from "./client";
import type {
  PushApi,
  PushApiClient,
  PushPublicKeyResponse,
} from "./push.api.types";

export type { PushApi, PushSubscriptionRequest } from "./push.api.types";

export function createPushApi(client: PushApiClient): PushApi {
  return {
    async deleteSubscription(accessToken, subscription): Promise<void> {
      await client.request("/push/subscriptions", isEmptyResponse, {
        body: subscription,
        expectedStatus: 204,
        headers: bearer(accessToken),
        method: "DELETE",
      });
    },
    async getPublicKey(accessToken): Promise<string> {
      const response = await client.request(
        "/push/public-key",
        isPushPublicKeyResponse,
        {
          expectedStatus: 200,
          headers: bearer(accessToken),
          method: "GET",
        },
      );

      if (!(await isP256PublicKey(response.publicKey))) {
        throw new ApiError({
          code: apiContractErrorCode,
          details: response,
          message: apiResponseContractErrorMessage,
          requestId: null,
          status: 200,
        });
      }

      return response.publicKey;
    },
    async saveSubscription(accessToken, subscription): Promise<void> {
      await client.request("/push/subscriptions", isEmptyResponse, {
        body: subscription,
        expectedStatus: 204,
        headers: bearer(accessToken),
        method: "PUT",
      });
    },
  };
}

function bearer(accessToken: string): Record<string, string> {
  return { authorization: `Bearer ${accessToken}` };
}

function isEmptyResponse(value: unknown): value is undefined {
  return value === undefined;
}

function isPushPublicKeyResponse(
  value: unknown,
): value is PushPublicKeyResponse {
  return (
    isRecord(value) &&
    typeof value.publicKey === "string" &&
    isVapidPublicKey(value.publicKey)
  );
}

function isVapidPublicKey(value: string): boolean {
  return toVapidPublicKeyBytes(value) !== null;
}

function toVapidPublicKeyBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;

  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const key = new Uint8Array(new ArrayBuffer(decoded.length));

    for (const [index, character] of Array.from(decoded).entries()) {
      key[index] = character.charCodeAt(0);
    }

    return key.length === 65 && key[0] === 4 ? key : null;
  } catch {
    return null;
  }
}

async function isP256PublicKey(value: string): Promise<boolean> {
  const key = toVapidPublicKeyBytes(value);
  if (key === null) return false;

  try {
    await crypto.subtle.importKey(
      "raw",
      key,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );

    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
