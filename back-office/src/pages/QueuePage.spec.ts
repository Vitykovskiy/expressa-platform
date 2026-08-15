import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ordersApi = {
  details: vi.fn(),
  list: vi.fn(),
  transition: vi.fn(),
};

vi.mock("../app/session.store", () => ({
  useSessionStore: () => ({ accessToken: "access-token" }),
}));
vi.mock("../shared/api/orders.api", () => ({
  OrdersApi: class {
    constructor() {
      return ordersApi;
    }
  },
}));

import QueuePage from "./QueuePage.vue";

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  number: "20300102-001",
  createdAt: "2030-01-02T10:00:00.000Z",
  totalMinor: 38000,
  stage: "CREATED" as const,
};

const secondOrder = {
  ...order,
  id: "22222222-2222-4222-8222-222222222222",
  number: "20300102-002",
};

describe("QueuePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    ordersApi.list.mockResolvedValue([order, secondOrder]);
  });

  afterEach(() => vi.useRealTimers());

  it("сохраняет поиск и фильтр при polling", async () => {
    const wrapper = mount(QueuePage);
    await flushPromises();
    await wrapper.get('input[type="search"]').setValue("20300102-001");
    await wrapper.get("select").setValue("CREATED");
    await flushPromises();

    await vi.advanceTimersByTimeAsync(5000);

    expect(ordersApi.list).toHaveBeenLastCalledWith("access-token", {
      number: "20300102-001",
      stage: "CREATED",
    });
    wrapper.unmount();
  });

  it("очищает старые детали до ответа нового заказа", async () => {
    ordersApi.details.mockResolvedValue({
      ...order,
      customer: { id: "customer", phoneE164: "+79991234567" },
      events: [],
      snapshot: [],
    });
    const wrapper = mount(QueuePage);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await vi.runAllTicks();

    expect(wrapper.text()).toContain("Клиент: +79991234567");
    wrapper.unmount();
  });

  it("не показывает ошибку перехода A после открытия заказа B", async () => {
    let rejectTransition: (error: unknown) => void = () => undefined;
    ordersApi.details.mockImplementation(
      async (_token: string, orderId: string) => ({
        ...(orderId === order.id ? order : secondOrder),
        customer: { id: `customer-${orderId}`, phoneE164: "+79991234567" },
        events: [],
        snapshot: [],
      }),
    );
    ordersApi.transition.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectTransition = reject;
        }),
    );
    const wrapper = mount(QueuePage);
    await flushPromises();

    await wrapper.findAll(".order-card__details-button")[0]!.trigger("click");
    await flushPromises();
    await wrapper.get(".order-card__action").trigger("click");
    await wrapper.findAll(".order-card__details-button")[1]!.trigger("click");
    await flushPromises();
    rejectTransition({
      code: "ORDER_STAGE_CONFLICT",
      details: null,
      message: "Стадия изменилась.",
      requestId: "request-a",
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain("ORDER_STAGE_CONFLICT");
    wrapper.unmount();
  });

  it("показывает автора перехода в деталях заказа", async () => {
    ordersApi.details.mockResolvedValue({
      ...order,
      customer: { id: "customer", phoneE164: "+79991234567" },
      events: [
        {
          actorId: "staff-42",
          from: "CREATED",
          to: "ACCEPTED",
          occurredAt: "2030-01-02T10:01:00.000Z",
        },
      ],
      snapshot: [],
    });
    const wrapper = mount(QueuePage);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Автор: staff-42");
    wrapper.unmount();
  });
});
