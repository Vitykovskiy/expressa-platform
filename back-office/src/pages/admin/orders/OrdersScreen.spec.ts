import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import OrdersScreen from "./OrdersScreen.vue";

describe("OrdersScreen", () => {
  it("показывает проверку состояния вместо сырой ошибки перехода", async () => {
    const wrapper = mount(OrdersScreen, {
      props: {
        orders: [],
        search: "",
        stage: "ALL",
        status: "ready",
        error: null,
        accessRecoveryPending: false,
        requiresAccessRecovery: false,
        selectedOrderId: null,
        details: null,
        detailsError: null,
        detailsLoading: false,
        transitionLoading: false,
        transitionRecoveryPending: false,
        requiresTransitionRecovery: true,
        actionError: {
          code: "SERVER_ERROR",
          details: null,
          message: "trace",
          requestId: "transition-1",
        },
      },
    });

    const alert = wrapper.get(".orders-screen__action-error");
    expect(alert.text()).toContain("Не удалось подтвердить изменение заказа");
    expect(alert.text()).not.toContain("SERVER_ERROR: trace");
    expect(alert.get("details").text()).toContain("SERVER_ERROR");
    await alert.get(".admin-button").trigger("click");
    expect(wrapper.emitted("recover-transition")).toEqual([[]]);
  });

  it("различает пустую очередь, поиск без совпадений и пустую стадию", () => {
    const props = {
      orders: [],
      status: "ready" as const,
      error: null,
      accessRecoveryPending: false,
      requiresAccessRecovery: false,
      selectedOrderId: null,
      details: null,
      detailsError: null,
      detailsLoading: false,
      transitionLoading: false,
      transitionRecoveryPending: false,
      requiresTransitionRecovery: false,
      actionError: null,
    };
    const global = mount(OrdersScreen, {
      props: { ...props, search: "", stage: "ALL" },
    });
    const search = mount(OrdersScreen, {
      props: { ...props, search: "NO-MATCH", stage: "ALL" },
    });
    const stage = mount(OrdersScreen, {
      props: { ...props, search: "", stage: "ACCEPTED" },
    });

    expect(global.text()).toContain("Активные заказы появятся здесь");
    expect(search.text()).toContain("Заказы не найдены");
    expect(search.text()).toContain("Измените номер заказа");
    expect(stage.text()).toContain("В этой стадии пока нет заказов");
    expect(stage.text()).toContain("Выберите другую стадию");
  });

  it("возвращает карточку после изменения поиска или стадии", async () => {
    const wrapper = mount(OrdersScreen, {
      props: {
        orders: [],
        search: "NO-MATCH",
        stage: "ALL",
        status: "ready",
        error: null,
        accessRecoveryPending: false,
        requiresAccessRecovery: false,
        selectedOrderId: null,
        details: null,
        detailsError: null,
        detailsLoading: false,
        transitionLoading: false,
        transitionRecoveryPending: false,
        requiresTransitionRecovery: false,
        actionError: null,
      },
    });

    expect(wrapper.text()).toContain("Заказы не найдены");
    await wrapper.setProps({
      orders: [
        {
          id: "order-1",
          number: "Q-1001",
          createdAt: "2026-09-09T10:00:00.000Z",
          total: 450,
          stage: "CREATED",
        },
      ],
      search: "",
    });

    expect(wrapper.text()).toContain("Q-1001");
    expect(wrapper.text()).not.toContain("Заказы не найдены");
  });

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
        transitionRecoveryPending: false,
        requiresTransitionRecovery: false,
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
        transitionRecoveryPending: false,
        requiresTransitionRecovery: false,
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
        transitionRecoveryPending: false,
        requiresTransitionRecovery: false,
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
