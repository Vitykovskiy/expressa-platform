import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import OrdersScreen from "./OrdersScreen.vue";

describe("OrdersScreen", () => {
  it("показывает одну понятную recovery без TopBar action", async () => {
    const wrapper = mount(OrdersScreen, {
      props: {
        orders: [],
        search: "",
        stage: "ALL",
        status: "error",
        error: {
          code: "FAILED",
          message: "Сервер недоступен",
          requestId: "request-1",
          details: null,
        },
        accessRecoveryPending: false,
        requiresAccessRecovery: false,
        selectedOrderId: null,
        details: null,
        detailsError: null,
        detailsLoading: false,
        transitionLoading: false,
        actionError: null,
      },
    });
    expect(wrapper.find('[aria-label="Обновить очередь"]').exists()).toBe(
      false,
    );
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Не удалось загрузить очередь заказов",
    );
    expect(wrapper.get("details").attributes("open")).toBeUndefined();
    await wrapper.get(".orders-screen__retry").trigger("click");
    expect(wrapper.emitted("refresh")).toEqual([[]]);
  });

  it("предлагает одно восстановление доступа и блокирует повтор во время него", async () => {
    const wrapper = mount(OrdersScreen, {
      props: {
        orders: [],
        search: "",
        stage: "ALL",
        status: "error",
        error: {
          code: "UNAUTHORIZED",
          message: "Доступ не подтверждён",
          requestId: null,
          details: null,
        },
        accessRecoveryPending: true,
        requiresAccessRecovery: true,
        selectedOrderId: null,
        details: null,
        detailsError: null,
        detailsLoading: false,
        transitionLoading: false,
        actionError: null,
      },
    });

    expect(wrapper.text()).toContain("Восстановите доступ");
    expect(wrapper.get(".orders-screen__retry").text()).toBe(
      "Восстанавливаем доступ…",
    );
    expect(
      wrapper.get(".orders-screen__retry").attributes("disabled"),
    ).toBeDefined();
    expect(wrapper.find('[aria-label="Обновить очередь"]').exists()).toBe(
      false,
    );
  });

  it("сохраняет компактную нейтральную диагностику с длинным значением", () => {
    const wrapper = mount(OrdersScreen, {
      props: {
        orders: [],
        search: "",
        stage: "ALL",
        status: "error",
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "x".repeat(240),
          requestId: "request-1",
          details: null,
        },
        accessRecoveryPending: false,
        requiresAccessRecovery: false,
        selectedOrderId: null,
        details: null,
        detailsError: null,
        detailsLoading: false,
        transitionLoading: false,
        actionError: null,
      },
    });

    expect(wrapper.get("h2").text()).toBe(
      "Не удалось загрузить очередь заказов",
    );
    expect(wrapper.get(".orders-screen__retry").text()).toBe("Повторить");
    expect(wrapper.get("details").attributes("open")).toBeUndefined();
    expect(wrapper.get(".orders-screen__diagnostics dd").text()).toContain(
      "INTERNAL_SERVER_ERROR",
    );
  });
});
