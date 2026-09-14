import { describe, expect, it, vi } from "vitest";

import { ApiClient } from "./client";
import { OrdersApi } from "./orders.api";

function createApi(fetcher: typeof fetch): OrdersApi {
  return new OrdersApi(
    new ApiClient({ baseUrl: "https://api.example.test/api/v2", fetcher }),
  );
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  number: "20300102-001",
  createdAt: "2030-01-02T10:00:00.000Z",
  total: 380,
  stage: "CREATED" as const,
};
const actorId = "22222222-2222-4222-8222-222222222222";
const actorLabel = "+79991234567";

function detailsResponse() {
  return {
    ...order,
    customer: {
      id: "33333333-3333-4333-8333-333333333333",
      phoneE164: "+79990000000",
    },
    events: [
      {
        actorId,
        actorLabel,
        from: "CREATED" as const,
        occurredAt: "2030-01-02T10:01:00.000Z",
        to: "ACCEPTED" as const,
      },
    ],
    snapshot: [
      {
        productId: "44444444-4444-4444-8444-444444444444",
        priceChoiceId: "55555555-5555-4555-8555-555555555555",
        productName: "Капучино",
        portionLabel: "350 мл",
        quantity: 1,
        unitTotal: 320,
        lineTotal: 320,
        modifiers: [],
      },
    ],
  };
}

describe("OrdersApi", () => {
  it.each([380.5, -1, 2_147_483_648])(
    "отклоняет сумму вне целого int32: %s",
    async (total) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(response([{ ...order, total }]));

      await expect(
        createApi(fetcher).list("access-token", { number: "", stage: null }),
      ).rejects.toMatchObject({ code: "API_CONTRACT_ERROR" });
    },
  );

  it("читает очередь v3 и сохраняет подпись порции из снимка", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response([order]));

    await expect(
      createApi(fetcher).list("access-token", {
        number: order.number,
        stage: "CREATED",
      }),
    ).resolves.toEqual([order]);

    const [url, request] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.example.test/api/v3/backoffice/orders?number=20300102-001&stage=CREATED",
    );
    expect(request).toMatchObject({
      method: "GET",
      headers: { authorization: "Bearer access-token" },
    });
  });

  it("выполняет переход через v2 и читает обновлённые детали v3", async () => {
    const details = { ...detailsResponse(), events: [] };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ ...details, stage: "ACCEPTED" }))
      .mockResolvedValueOnce(response({ ...details, stage: "ACCEPTED" }));

    await expect(
      createApi(fetcher).transition("access-token", details),
    ).resolves.toMatchObject({ stage: "ACCEPTED" });

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      `https://api.example.test/api/v2/backoffice/orders/${order.id}/accept`,
    );
    expect(fetcher.mock.calls[1]?.[0]).toBe(
      `https://api.example.test/api/v3/backoffice/orders/${order.id}`,
    );
  });

  it("принимает v3-снимок с произвольной подписью порции", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(detailsResponse()));

    await expect(
      createApi(fetcher).details("access-token", order.id),
    ).resolves.toMatchObject({
      snapshot: [
        {
          priceChoiceId: "55555555-5555-4555-8555-555555555555",
          portionLabel: "350 мл",
        },
      ],
    });

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      `https://api.example.test/api/v3/backoffice/orders/${order.id}`,
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

  it("преобразует UUID автора в подпись сотрудника", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(detailsResponse()));

    await expect(
      createApi(fetcher).details("access-token", order.id),
    ).resolves.toMatchObject({
      events: [
        {
          actorLabel,
          from: "CREATED",
          to: "ACCEPTED",
        },
      ],
    });
  });

  it.each([
    ["без подписи порции", undefined],
    ["с нестроковой подписью порции", 350],
  ])("отклоняет v3-снимок %s", async (_description, portionLabelValue) => {
    const details = detailsResponse();
    const item = { ...details.snapshot[0] } as Record<string, unknown>;
    if (portionLabelValue === undefined) {
      delete item.portionLabel;
    } else {
      item.portionLabel = portionLabelValue;
    }
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ ...details, snapshot: [item] }));

    await expect(
      createApi(fetcher).details("access-token", order.id),
    ).rejects.toMatchObject({ code: "API_CONTRACT_ERROR" });
  });
});
