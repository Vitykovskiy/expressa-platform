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
      expect(wrapper.find('[aria-label="Настройки"]').exists()).toBe(true);
      expect(wrapper.get('[role="alert"]').text()).toContain(
        "Не удалось загрузить историю заказов.",
      );

      await wrapper.get(".orders-history__retry").trigger("click");

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
    expect(empty.text()).toContain("Перейти в меню");
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

  it("передаёт повтор только для завершённой карточки", async () => {
    const wrapper = mountScreen({ orders: [{ ...order, stage: "ISSUED" }] });

    await wrapper.get(".order-card-repeat").trigger("click");

    expect(wrapper.emitted("repeat")).toEqual([[order.id]]);
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
      staleMessage: null,
      ...props,
    },
    global: {
      stubs: {
        OrderNotificationsSection: {
          template: '<section id="notifications" />',
        },
        OrderCard: {
          props: ["order"],
          template:
            '<article><button class="order-card-repeat" @click="$emit(\'repeat\', order.id)">Повторить заказ</button></article>',
        },
        UiBtn: { template: "<button><slot /></button>" },
      },
    },
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
