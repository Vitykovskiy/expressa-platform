import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useCheckoutStore } from "../customer/pages/checkout/checkout.store";
import OrderPage from "./OrderPage.vue";

describe("OrderPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("показывает начальный статус, конфигурацию позиций и итог", async () => {
    const checkout = useCheckoutStore();
    checkout.order = {
      id: "00000000-0000-4000-8000-000000000003",
      items: [
        {
          lineTotalMinor: 56_000,
          modifiers: [
            {
              modifierName: "Овсяное молоко",
              modifierOptionId: "00000000-0000-4000-8000-000000000004",
              priceDeltaMinor: 60,
            },
          ],
          productId: "00000000-0000-4000-8000-000000000001",
          productName: "Капучино",
          quantity: 1,
          size: "M",
          unitTotalMinor: 56_000,
          variantId: "00000000-0000-4000-8000-000000000002",
        },
      ],
      number: "1042",
      stage: "CREATED",
      totalMinor: 56_000,
    };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: OrderPage, path: "/orders/:id" }],
    });
    await router.push(`/orders/${checkout.order.id}`);
    await router.isReady();

    const wrapper = mount(OrderPage, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain("Заказ принят");
    expect(wrapper.text()).toContain("Заказ №1042");
    expect(wrapper.text()).toContain("Капучино");
    expect(wrapper.text()).toContain("Размер M");
    expect(wrapper.text()).toContain("Овсяное молоко");
    expect(wrapper.text()).toMatch(/Итого560\s₽/u);
  });

  it("не показывает чужой результат заказа", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: OrderPage, path: "/orders/:id" }],
    });
    await router.push("/orders/unknown");
    await router.isReady();

    const wrapper = mount(OrderPage, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain(
      "Данные заказа доступны сразу после оформления.",
    );
  });
});
