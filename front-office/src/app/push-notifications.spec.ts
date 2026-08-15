import { describe, expect, it } from "vitest";

import { toOrderUrl } from "./push-notifications";

describe("push notifications", () => {
  it("строит внутренний маршрут только для UUID заказа", () => {
    expect(
      toOrderUrl({ orderId: "00000000-0000-4000-8000-000000000003" }),
    ).toBe("/orders/00000000-0000-4000-8000-000000000003");
  });

  it.each([
    undefined,
    {},
    { orderId: "/orders/00000000-0000-4000-8000-000000000003" },
    { orderId: "https://example.test" },
  ])("не открывает внешний или невалидный маршрут: %o", (value) => {
    expect(toOrderUrl(value)).toBeNull();
  });
});
