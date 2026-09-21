import { describe, expect, it } from "vitest";

import type { CustomerOrder } from "@/shared/api/orders.api";

const order: CustomerOrder = {
  id: "00000000-0000-4000-8000-000000000001",
  number: "1042",
  stage: "ACCEPTED",
  total: 560,
  createdAt: "2026-08-16T12:00:00.000Z",
  items: [
    {
      productId: "00000000-0000-4000-8000-000000000002",
      productName: "Капучино",
      quantity: 1,
      unitTotal: 560,
      lineTotal: 560,
      priceChoiceId: "00000000-0000-4000-8000-000000000003",
      portionLabel: "250 мл",
      modifiers: [],
    },
  ],
};

describe("OrderPage", () => {
  it("uses the v3 immutable price-choice snapshot", () => {
    expect(order.items).toEqual([
      expect.objectContaining({
        priceChoiceId: "00000000-0000-4000-8000-000000000003",
        portionLabel: "250 мл",
      }),
    ]);
  });
});
