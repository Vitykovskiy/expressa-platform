import { describe, expect, it } from "vitest";

import { ApiClient } from "./client";
import { createOrdersApi } from "./orders.api";

const order = {
  id: "00000000-0000-4000-8000-000000000001",
  number: "20300102-001",
  stage: "CREATED",
  total: 300,
  createdAt: "2030-01-02T03:04:05.000Z",
  items: [
    {
      productId: "00000000-0000-4000-8000-000000000002",
      productName: "Капучино",
      quantity: 1,
      unitPrice: 300,
      lineTotal: 300,
      priceChoiceId: "00000000-0000-4000-8000-000000000003",
      portionLabel: "250 мл",
      modifiers: [],
    },
  ],
};

describe("OrdersApi", () => {
  it("creates an order with v3 priceChoiceId and immutable portion label", async () => {
    const api = createOrdersApi(client(order));

    await expect(
      api.createOrder(
        "access",
        {
          expectedTotal: 300,
          items: [
            {
              productId: order.items[0].productId,
              quantity: 1,
              priceChoiceId: order.items[0].priceChoiceId!,
              modifierOptionIds: [],
            },
          ],
        },
        "00000000-0000-4000-8000-000000000004",
      ),
    ).resolves.toMatchObject({
      items: [
        { priceChoiceId: order.items[0].priceChoiceId, portionLabel: "250 мл" },
      ],
    });
  });
});

function client(response: unknown): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v3",
    fetcher: async () =>
      new Response(JSON.stringify(response), { status: 201 }),
  });
}
