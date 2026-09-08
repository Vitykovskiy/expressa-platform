import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import OrdersHistoryScreen from "./OrdersHistoryScreen.vue";

describe("OrdersHistoryScreen", () => {
  it.each([{ orders: [] }, { orders: [order] }])(
    "при ошибке оставляет один повтор без header refresh: %s",
    async ({ orders }) => {
      const wrapper = mountScreen({
        errorMessage: "Не удалось загрузить историю заказов.",
        orders,
      });

      expect(
        wrapper.find('[aria-label="Обновить историю заказов"]').exists(),
      ).toBe(false);
      expect(wrapper.findAll("button")).toHaveLength(1);
      expect(wrapper.get('[role="alert"]').text()).toContain(
        "Не удалось загрузить историю заказов.",
      );

      await wrapper.get("button").trigger("click");

      expect(wrapper.emitted("retry")).toEqual([[]]);
    },
  );

  it("сохраняет refresh для ready и empty", async () => {
    const ready = mountScreen({ orders: [order] });
    const empty = mountScreen();

    await ready.get('[aria-label="Обновить историю заказов"]').trigger("click");
    await empty.get('[aria-label="Обновить историю заказов"]').trigger("click");

    expect(ready.emitted("retry")).toEqual([[]]);
    expect(empty.emitted("retry")).toEqual([[]]);
    expect(empty.get('[role="status"]').text()).toContain(
      "История заказов пуста",
    );
  });

  it("сохраняет loading status и pagination events", async () => {
    const loading = mountScreen({ loading: true });
    const paginated = mountScreen({ hasMore: true, orders: [order] });

    expect(loading.attributes("aria-busy")).toBe("true");
    expect(loading.get('[role="status"]').text()).toContain(
      "Загружаем историю",
    );

    await paginated.get(".orders-history > button").trigger("click");

    expect(paginated.emitted("loadMore")).toEqual([[]]);
  });
});

function mountScreen(
  props: Partial<InstanceType<typeof OrdersHistoryScreen>["$props"]> = {},
) {
  return mount(OrdersHistoryScreen, {
    props: {
      errorMessage: null,
      hasMore: false,
      loading: false,
      orders: [],
      ...props,
    },
    global: { stubs: { OrderCard: { template: "<article />" } } },
  });
}

const order = {
  createdAt: "2026-09-05T12:00:00.000Z",
  id: "order-1",
  items: [],
  number: "20260905-001",
  stage: "CREATED" as const,
  total: 320,
};
