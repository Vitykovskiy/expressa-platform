import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import OrderCard from "./OrderCard.vue";

describe("OrderCard", () => {
  it("показывает суммы заказа и позиций целыми рублями", () => {
    const wrapper = mount(OrderCard, {
      props: {
        details: {
          ...order,
          customer: { id: "customer-1", phoneE164: "+79990000000" },
          events: [],
          snapshot: [
            {
              productId: "product-1",
              variantId: null,
              productName: "Американо",
              size: null,
              quantity: 1,
              unitTotal: 320,
              lineTotal: 320,
              modifiers: [],
            },
          ],
        },
        detailsLoading: false,
        order,
        transitionLoading: false,
      },
    });

    expect(wrapper.get(".order-card__total").text()).toBe("320 ₽");
    expect(wrapper.get(".order-card__item").text()).toContain("320 ₽");
    expect(wrapper.text()).not.toContain(",00");
  });
});

const order = {
  id: "order-1",
  number: "A-001",
  createdAt: "2026-08-30T10:00:00.000Z",
  total: 320,
  stage: "CREATED" as const,
};
