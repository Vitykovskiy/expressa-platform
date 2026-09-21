import { createOrderFingerprint } from "./order-fingerprint";
import type { OrderRequest } from "./order.types";

describe("createOrderFingerprint", () => {
  it("canonicalizes v3 price-choice and modifier order", () => {
    const first: OrderRequest = {
      total: 100,
      items: [
        {
          productId: "coffee",
          priceChoiceId: "small",
          modifierOptionIds: ["sugar", "milk"],
          quantity: 1,
        },
      ],
    };
    const reordered: OrderRequest = {
      total: 100,
      items: [
        {
          productId: "coffee",
          priceChoiceId: "small",
          modifierOptionIds: ["milk", "sugar"],
          quantity: 1,
        },
      ],
    };
    expect(createOrderFingerprint(first)).toBe(
      createOrderFingerprint(reordered),
    );
  });
});
