import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "./client";
import { OrdersApi } from "./orders.api";

function createApi(fetcher: typeof fetch): OrdersApi {
  return new OrdersApi(
    new ApiClient({ baseUrl: "https://api.example.test/api/v1", fetcher }),
  );
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  number: "20300102-001",
  createdAt: "2030-01-02T10:00:00.000Z",
  totalMinor: 38000,
  stage: "CREATED" as const,
};

describe("OrdersApi", () => {
  it("передаёт поиск и стадию каноническому маршруту очереди", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response([order]));

    await expect(
      createApi(fetcher).list("access-token", {
        number: order.number,
        stage: "CREATED",
      }),
    ).resolves.toEqual([order]);

    const [url, request] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.example.test/api/v1/backoffice/orders?number=20300102-001&stage=CREATED",
    );
    expect(request).toMatchObject({
      method: "GET",
      headers: { authorization: "Bearer access-token" },
    });
  });

  it("вызывает только следующее действие и сохраняет детали", async () => {
    const details = {
      ...order,
      customer: {
        id: "22222222-2222-4222-8222-222222222222",
        phoneE164: "+79991234567",
      },
      snapshot: [],
      events: [],
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ ...details, stage: "ACCEPTED" }));

    await expect(
      createApi(fetcher).transition("access-token", details),
    ).resolves.toMatchObject({ stage: "ACCEPTED" });

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      `https://api.example.test/api/v1/backoffice/orders/${order.id}/accept`,
    );
  });

  it("отклоняет ответ с неизвестной стадией", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response([{ ...order, stage: "CLOSED" }]));

    await expect(
      createApi(fetcher).list("access-token", { number: "", stage: null }),
    ).rejects.toMatchObject({ code: "API_CONTRACT_ERROR" });
  });
});
