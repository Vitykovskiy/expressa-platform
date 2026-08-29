import { describe, expect, it } from "vitest";

import { ApiClient, ApiError } from "./client";
import { createPushApi } from "./push.api";

describe("PushApi", () => {
  it("получает публичный ключ и сохраняет подписку текущего пользователя", async () => {
    const calls: RequestInit[] = [];
    const api = createPushApi(
      client([{ publicKey: validVapidPublicKey }, undefined], calls),
    );

    await expect(api.getPublicKey("access")).resolves.toBe(validVapidPublicKey);
    await expect(
      api.saveSubscription("access", subscription),
    ).resolves.toBeUndefined();

    expect(calls).toEqual([
      expect.objectContaining({
        headers: { authorization: "Bearer access" },
        method: "GET",
      }),
      expect.objectContaining({
        body: JSON.stringify(subscription),
        headers: {
          "content-type": "application/json",
          authorization: "Bearer access",
        },
        method: "PUT",
      }),
    ]);
  });

  it("удаляет подписку текущего пользователя", async () => {
    const calls: RequestInit[] = [];
    const api = createPushApi(client([undefined], calls));

    await expect(
      api.deleteSubscription("access", subscription),
    ).resolves.toBeUndefined();

    expect(calls[0]).toMatchObject({
      body: JSON.stringify(subscription),
      headers: {
        "content-type": "application/json",
        authorization: "Bearer access",
      },
      method: "DELETE",
    });
  });

  it.each([
    { publicKey: "" },
    { publicKey: ` ${validVapidPublicKey}` },
    { publicKey: `${validVapidPublicKey}=` },
    { publicKey: validVapidPublicKey.replace(/-/u, "+") },
    { publicKey: "A" },
    { publicKey: "AQID" },
    { publicKey: `A${validVapidPublicKey.slice(1)}` },
    {
      publicKey:
        "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {},
    null,
  ])("отклоняет невалидный ответ с публичным ключом: %o", async (response) => {
    await expect(
      createPushApi(client([response])).getPublicKey("access"),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });
});

function client(responses: unknown[], calls: RequestInit[] = []): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v2",
    fetcher: async (_url, options) => {
      calls.push(options ?? {});
      const response = responses.shift();

      return new Response(
        response === undefined ? null : JSON.stringify(response),
        {
          status: response === undefined ? 204 : 200,
        },
      );
    },
  });
}

const subscription = {
  endpoint: "https://push.example/subscription",
  keys: { auth: "auth", p256dh: "p256dh" },
};

const validVapidPublicKey =
  "BKdrZ6EKrXOx0fbDPwF3egGVmOfYiacFCfz8g0-OG1FrCF_pmVddiHl8yPwv5kUNc9mu0vsPJgkuCwK1dbEWJ_k";
