import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "../app/router.constants";
import { apiClientKey, createApiClient } from "../shared/api/client";
import QueuePage from "./QueuePage.vue";

const session = vi.hoisted(() => ({
  accessToken: "example-token" as string | null,
  error: null as { message: string; requestId: string | null } | null,
  restore: vi.fn<() => Promise<void>>(),
  status: "authenticated" as
    "anonymous" | "authenticated" | "denied" | "unknown",
}));
const router = vi.hoisted(() => ({ replace: vi.fn<() => Promise<void>>() }));

vi.mock("../app/session.store", () => ({
  useSessionStore: () => session,
}));
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRouter: () => router,
}));

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  number: "20300102-001",
  createdAt: "2030-01-02T10:00:00.000Z",
  total: 380,
  stage: "CREATED" as const,
};

const secondOrder = {
  ...order,
  id: "22222222-2222-4222-8222-222222222222",
  number: "20300102-002",
};

const details = {
  ...order,
  customer: {
    id: "22222222-2222-4222-8222-222222222222",
    phoneE164: "+79991234567",
  },
  events: [],
  snapshot: [],
};

function detailsFor(
  currentOrder: typeof order | typeof secondOrder,
  events: unknown[] = [],
) {
  return {
    ...currentOrder,
    customer: {
      id: "33333333-3333-4333-8333-333333333333",
      phoneE164: "+79991234567",
    },
    events,
    snapshot: [],
  };
}

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function failure(requestId: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      code: "INTERNAL_SERVER_ERROR",
      details: null,
      message: "Сервис заказов временно недоступен.",
      requestId,
    }),
    { status },
  );
}

function mountQueue(apiBaseUrl: string, fetcher: typeof fetch) {
  return mount(QueuePage, {
    global: {
      provide: {
        [apiClientKey as symbol]: createApiClient(apiBaseUrl, fetcher),
      },
    },
  });
}

describe("QueuePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    session.accessToken = "example-token";
    session.error = null;
    session.status = "authenticated";
    session.restore.mockReset().mockResolvedValue();
    router.replace.mockReset().mockResolvedValue();
  });
  afterEach(() => vi.useRealTimers());

  it("использует предоставленный origin для очереди, деталей и перехода", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith("/accept")) {
        return response({ ...details, stage: "ACCEPTED" });
      }
      if (requestedUrl.endsWith(`/${order.id}`)) return response(details);

      return response([order]);
    });
    const wrapper = mountQueue("https://api.example.test", fetcher);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();
    await wrapper.get(".order-card__action").trigger("click");
    await flushPromises();

    expect(fetcher.mock.calls.map(([url]) => url.toString())).toEqual([
      "https://api.example.test/api/v2/backoffice/orders",
      `https://api.example.test/api/v2/backoffice/orders/${order.id}`,
      `https://api.example.test/api/v2/backoffice/orders/${order.id}/accept`,
    ]);
    wrapper.unmount();
  });

  it("повторяет ошибочную очередь через настроенный origin и возвращает обычное обновление", async () => {
    const apiBaseUrl = "https://api.example.test";
    const queueUrl = `${apiBaseUrl}/api/v2/backoffice/orders`;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INTERNAL_SERVER_ERROR",
            details: null,
            message: "Сервис очереди временно недоступен.",
            requestId: "request-1",
          }),
          { status: 500 },
        ),
      )
      .mockResolvedValue(response([order]));
    const wrapper = mountQueue(apiBaseUrl, fetcher);
    await flushPromises();

    expect(fetcher.mock.calls.map(([url]) => url.toString())).toEqual([
      queueUrl,
    ]);
    expect(wrapper.text()).toContain("Не удалось загрузить очередь заказов");
    expect(wrapper.find(".top-bar-action").exists()).toBe(false);

    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();

    expect(fetcher.mock.calls.map(([url]) => url.toString())).toEqual([
      queueUrl,
      queueUrl,
    ]);
    expect(wrapper.get(".order-card").text()).toContain(order.number);
    expect(wrapper.get(".top-bar-action").attributes("aria-label")).toBe(
      "Обновить очередь",
    );
    wrapper.unmount();
  });

  it("сохраняет раскрытую диагностику ошибки списка при polling", async () => {
    const failure = () =>
      new Response(
        JSON.stringify({
          code: "INTERNAL_SERVER_ERROR",
          details: null,
          message: "Очередь временно недоступна.",
          requestId: "queue-1",
        }),
        { status: 500 },
      );
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(failure());
    const wrapper = mountQueue("/", fetcher);
    document.body.append(wrapper.element);
    await flushPromises();
    const summary = wrapper.get(".orders-screen__diagnostics summary");
    await summary.trigger("click");

    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();

    expect(wrapper.get(".orders-screen__diagnostics summary").element).toBe(
      summary.element,
    );
    expect(wrapper.get(".orders-screen__diagnostics").attributes("open")).toBe(
      "",
    );
    wrapper.unmount();
    document.body.replaceChildren();
  });

  it("не заменяет ошибку списка loading-состоянием до следующего результата", async () => {
    let resolvePoll: (value: Response) => void = () => undefined;
    const failure = (requestId: string) =>
      new Response(
        JSON.stringify({
          code: "INTERNAL_SERVER_ERROR",
          details: null,
          message: "Очередь временно недоступна.",
          requestId,
        }),
        { status: 500 },
      );
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(failure("queue-1"))
      .mockImplementationOnce(
        () => new Promise<Response>((resolve) => (resolvePoll = resolve)),
      )
      .mockResolvedValue(failure("queue-2"));
    const wrapper = mountQueue("/", fetcher);
    document.body.append(wrapper.element);
    await flushPromises();
    const summary = wrapper.get(".orders-screen__diagnostics summary");
    await summary.trigger("click");
    (summary.element as HTMLElement).focus();

    await vi.advanceTimersByTimeAsync(5000);
    expect(wrapper.get(".orders-screen__diagnostics summary").element).toBe(
      summary.element,
    );
    expect(document.activeElement).toBe(summary.element);
    resolvePoll(failure("queue-2"));
    await flushPromises();
    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();
    expect(wrapper.text()).toContain("queue-2");
    expect(wrapper.get(".orders-screen__diagnostics").attributes("open")).toBe(
      "",
    );
    wrapper.unmount();
    document.body.replaceChildren();
  });

  it("сохраняет закрытую диагностику через ручной повтор, поиск, фильтр и polling", async () => {
    let resolveSearch: (value: Response) => void = () => undefined;
    let resolveFilter: (value: Response) => void = () => undefined;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(failure("queue-initial"))
      .mockResolvedValueOnce(failure("queue-manual"))
      .mockImplementationOnce(
        () => new Promise<Response>((resolve) => (resolveSearch = resolve)),
      )
      .mockImplementationOnce(
        () => new Promise<Response>((resolve) => (resolveFilter = resolve)),
      )
      .mockResolvedValueOnce(response([order]))
      .mockResolvedValueOnce(failure("queue-later"));
    const wrapper = mountQueue("/", fetcher);
    document.body.append(wrapper.element);
    await flushPromises();
    const summary = wrapper.get(".orders-screen__diagnostics summary");
    (summary.element as HTMLElement).focus();
    await summary.trigger("click");
    expect(document.activeElement).toBe(summary.element);
    expect(wrapper.get(".orders-screen__diagnostics").attributes("open")).toBe(
      "",
    );

    await summary.trigger("click");
    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    expect(
      wrapper.get(".orders-screen__diagnostics").attributes("open"),
    ).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(2);

    await wrapper.get('input[type="search"]').setValue(order.number);
    await wrapper
      .findAll(".filter-tab")
      .find((tab) => tab.text() === "Новые")!
      .trigger("click");
    expect(wrapper.find('[aria-label="Загрузка очереди"]').exists()).toBe(
      false,
    );
    resolveSearch(response([order]));
    await flushPromises();
    expect(wrapper.text()).toContain("queue-manual");
    resolveFilter(failure("queue-filter"));
    await flushPromises();
    expect(wrapper.text()).toContain("queue-filter");
    expect(
      fetcher.mock.calls.slice(2, 4).map(([url]) => url.toString()),
    ).toEqual([
      `/api/v2/backoffice/orders?number=${order.number}`,
      `/api/v2/backoffice/orders?number=${order.number}&stage=CREATED`,
    ]);

    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    expect(wrapper.find(".orders-screen__diagnostics").exists()).toBe(false);
    expect(wrapper.get(".order-card").text()).toContain(order.number);

    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(wrapper.text()).toContain("queue-later");
    expect(
      wrapper.get(".orders-screen__diagnostics").attributes("open"),
    ).toBeUndefined();
    wrapper.unmount();
    document.body.replaceChildren();
  });

  it("сохраняет поиск и фильтр при polling", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response([order, secondOrder]));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();
    await wrapper.get('input[type="search"]').setValue(order.number);
    await wrapper
      .findAll(".filter-tab")
      .find((tab) => tab.text() === "Новые")!
      .trigger("click");
    await flushPromises();

    await vi.advanceTimersByTimeAsync(50);

    expect(fetcher.mock.calls.at(-1)?.[0].toString()).toBe(
      `/api/v2/backoffice/orders?number=${order.number}&stage=CREATED`,
    );
    wrapper.unmount();
  });

  it("очищает старые детали до ответа нового заказа", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      if (url.toString().endsWith(`/${order.id}`)) {
        return response(detailsFor(order));
      }
      if (url.toString().endsWith(`/${secondOrder.id}`)) {
        return new Promise<Response>(() => undefined);
      }

      return response([order, secondOrder]);
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Клиент: +79991234567");
    await wrapper.findAll(".order-card__details-button")[1]!.trigger("click");
    await flushPromises();
    expect(wrapper.text()).not.toContain("Клиент: +79991234567");
    wrapper.unmount();
  });

  it("повторяет ошибку деталей в выбранной карточке отдельно от ошибки перехода", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response([order]))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INTERNAL_SERVER_ERROR",
            details: null,
            message: "Детали временно недоступны.",
            requestId: "details-1",
          }),
          { status: 500 },
        ),
      )
      .mockResolvedValue(response(detailsFor(order)));
    const wrapper = mountQueue("https://api.example.test", fetcher);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Не удалось загрузить детали заказа");
    expect(wrapper.text()).not.toContain("INTERNAL_SERVER_ERROR:");
    expect(wrapper.get(".order-card__details-button").text()).toBe(
      "Повторить загрузку деталей",
    );

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Клиент: +79991234567");
    wrapper.unmount();
  });

  it("показывает contract, server и network ошибки деталей в контексте карточки", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response([order]))
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(failure("details-server"))
      .mockRejectedValueOnce(new Error("network down"));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    for (const code of [
      "API_CONTRACT_ERROR",
      "INTERNAL_SERVER_ERROR",
      "NETWORK_ERROR",
    ]) {
      await wrapper.get(".order-card__details-button").trigger("click");
      await flushPromises();
      expect(wrapper.get(".order-card__details-error").text()).toContain(code);
      expect(
        wrapper.get(".order-card__diagnostics").attributes("open"),
      ).toBeUndefined();
    }
    expect(wrapper.find(".orders-screen__action-error").exists()).toBe(false);
    wrapper.unmount();
  });

  it("блокирует повтор деталей до ответа и восстанавливает скрытие и переход", async () => {
    let resolveDetails: (value: Response) => void = () => undefined;
    let detailsRequests = 0;
    const fetcher = vi.fn<typeof fetch>((url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith(`/${order.id}/accept`)) {
        return Promise.resolve(
          response({ ...detailsFor(order), stage: "ACCEPTED" }),
        );
      }
      if (requestedUrl.endsWith(`/${order.id}`)) {
        detailsRequests++;
        if (detailsRequests === 1) {
          return Promise.resolve(failure("details-first"));
        }
        return new Promise<Response>((resolve) => (resolveDetails = resolve));
      }
      return Promise.resolve(response([order]));
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();
    expect(wrapper.get(".order-card__details-button").text()).toBe(
      "Повторить загрузку деталей",
    );
    await wrapper.get(".order-card__details-button").trigger("click");
    expect(
      wrapper.get(".order-card__details-button").attributes("disabled"),
    ).toBeDefined();
    resolveDetails(response(detailsFor(order)));
    await flushPromises();
    expect(wrapper.get(".order-card__details-button").text()).toBe(
      "Скрыть детали",
    );
    await wrapper.get(".order-card__action").trigger("click");
    await flushPromises();
    expect(wrapper.get(".order-card__stage").text()).toBe("Принят");
    await wrapper.get(".order-card__details-button").trigger("click");
    expect(wrapper.text()).not.toContain("Клиент: +79991234567");
    wrapper.unmount();
  });

  it("не переносит запоздалую ошибку деталей A в выбранный заказ B", async () => {
    let rejectDetailsA: (reason?: unknown) => void = () => undefined;
    const fetcher = vi.fn<typeof fetch>((url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith(`/${order.id}`)) {
        return new Promise<Response>(
          (_resolve, reject) => (rejectDetailsA = reject),
        );
      }
      if (requestedUrl.endsWith(`/${secondOrder.id}`)) {
        return Promise.resolve(response(detailsFor(secondOrder)));
      }
      return Promise.resolve(response([order, secondOrder]));
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();
    await wrapper.findAll(".order-card__details-button")[0]!.trigger("click");
    await wrapper.findAll(".order-card__details-button")[1]!.trigger("click");
    await flushPromises();
    rejectDetailsA(new Error("network down"));
    await flushPromises();

    expect(wrapper.text()).toContain("Клиент: +79991234567");
    expect(wrapper.find(".order-card__details-error").exists()).toBe(false);
    wrapper.unmount();
  });

  it("оставляет ошибку перехода отдельной от повтора деталей", async () => {
    const fetcher = vi.fn<typeof fetch>((url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith(`/${order.id}/accept`)) {
        return Promise.resolve(failure("transition-conflict", 409));
      }
      if (requestedUrl.endsWith(`/${order.id}`)) {
        return Promise.resolve(response(detailsFor(order)));
      }
      return Promise.resolve(response([order]));
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();
    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();
    await wrapper.get(".order-card__action").trigger("click");
    await flushPromises();

    expect(wrapper.get(".orders-screen__action-error").text()).toContain(
      "INTERNAL_SERVER_ERROR",
    );
    expect(wrapper.get(".order-card__details-button").text()).toBe(
      "Скрыть детали",
    );
    wrapper.unmount();
  });

  it("показывает стадии заказа в бизнес-терминах", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      if (url.toString().endsWith(`/${order.id}`)) {
        return response(
          detailsFor(order, [
            {
              actorId: "44444444-4444-4444-8444-444444444444",
              actorLabel: "+79991234567",
              from: "CREATED",
              occurredAt: "2030-01-02T10:01:00.000Z",
              to: "READY",
            },
          ]),
        );
      }

      return response([order]);
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    expect(wrapper.get(".order-card__stage").text()).toBe("Оформлен");
    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Оформлен — Готов");
    wrapper.unmount();
  });

  it("не показывает ошибку перехода A после открытия заказа B", async () => {
    let rejectTransition: (value: Response) => void = () => undefined;
    const fetcher = vi.fn<typeof fetch>((url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith("/accept")) {
        return new Promise((resolve) => {
          rejectTransition = resolve;
        });
      }
      if (requestedUrl.endsWith(`/${order.id}`)) {
        return Promise.resolve(response(detailsFor(order)));
      }
      if (requestedUrl.endsWith(`/${secondOrder.id}`)) {
        return Promise.resolve(response(detailsFor(secondOrder)));
      }

      return Promise.resolve(response([order, secondOrder]));
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.findAll(".order-card__details-button")[0]!.trigger("click");
    await flushPromises();
    await wrapper.get(".order-card__action").trigger("click");
    await wrapper.findAll(".order-card__details-button")[1]!.trigger("click");
    await flushPromises();
    rejectTransition(
      new Response(
        JSON.stringify({
          code: "ORDER_STAGE_CONFLICT",
          details: null,
          message: "Стадия изменилась.",
          requestId: "request-a",
        }),
        { status: 409 },
      ),
    );
    await flushPromises();

    expect(wrapper.text()).not.toContain("ORDER_STAGE_CONFLICT");
    wrapper.unmount();
  });

  it("показывает автора перехода в деталях заказа", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      if (url.toString().endsWith(`/${order.id}`)) {
        return response(
          detailsFor(order, [
            {
              actorId: "44444444-4444-4444-8444-444444444444",
              actorLabel: "+79991234567",
              from: "CREATED",
              occurredAt: "2030-01-02T10:01:00.000Z",
              to: "ACCEPTED",
            },
          ]),
        );
      }

      return response([order]);
    });
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".order-card__details-button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Автор: +79991234567");
    expect(wrapper.text()).not.toContain("staff-42");
    wrapper.unmount();
  });

  it("сохраняет same-origin путь предоставленного клиента", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response([order]));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    expect(fetcher.mock.calls[0]?.[0].toString()).toBe(
      "/api/v2/backoffice/orders",
    );
    wrapper.unmount();
  });

  it("после 401 восстанавливает доступ одним GET и возобновляет polling не раньше 5200ms", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(failure("unauthorized", 401))
      .mockResolvedValueOnce(response([order]));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    expect(wrapper.get(".orders-screen__retry").text()).toBe(
      "Восстановить доступ",
    );
    let resolveRestore: () => void = () => undefined;
    session.restore.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRestore = resolve)),
    );
    await wrapper.get(".orders-screen__retry").trigger("click");
    expect(
      wrapper.get(".orders-screen__retry").attributes("disabled"),
    ).toBeDefined();
    await wrapper.get(".orders-screen__retry").trigger("click");
    resolveRestore();
    await flushPromises();

    expect(session.restore).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(
      fetcher.mock.calls.every(([, options]) => options?.method !== "POST"),
    ).toBe(true);
    expect(wrapper.get(".order-card").text()).toContain(order.number);
    await vi.advanceTimersByTimeAsync(5199);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(4);
    wrapper.unmount();
  });

  it("не запускает список при временной ошибке восстановления и ведёт anonymous на вход", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(failure("unauthorized", 401));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    session.error = { message: "Сеть недоступна", requestId: null };
    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    await vi.advanceTimersByTimeAsync(5200);
    expect(fetcher).toHaveBeenCalledTimes(1);

    session.error = null;
    session.status = "anonymous";
    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    expect(router.replace).toHaveBeenCalledWith("/login");
    expect(fetcher).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("создаёт новый приостановленный эпизод для 401 после восстановления", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(failure("unauthorized", 401));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    expect(session.restore).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(wrapper.get(".orders-screen__retry").text()).toBe(
      "Восстановить доступ",
    );
    wrapper.unmount();
  });

  it("отменяет отложенный resumed poll при новом 401 до его запуска", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(failure("initial-unauthorized", 401))
      .mockResolvedValueOnce(response([order]))
      .mockResolvedValueOnce(failure("new-unauthorized", 401));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    await wrapper.get('input[type="search"]').setValue(order.number);
    await flushPromises();

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(wrapper.get(".orders-screen__retry").text()).toBe(
      "Восстановить доступ",
    );
    await vi.advanceTimersByTimeAsync(10_200);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(session.restore).toHaveBeenCalledTimes(1);
    expect(
      fetcher.mock.calls.every(([, options]) => options?.method !== "POST"),
    ).toBe(true);
    wrapper.unmount();
  });

  it("не оставляет resumed poll после размонтирования", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(failure("initial-unauthorized", 401))
      .mockResolvedValueOnce(response([order]));
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".orders-screen__retry").trigger("click");
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
    wrapper.unmount();

    await vi.advanceTimersByTimeAsync(10_200);
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(session.restore).toHaveBeenCalledTimes(1);
    expect(
      fetcher.mock.calls.every(([, options]) => options?.method !== "POST"),
    ).toBe(true);
  });

  it("не возобновляет очередь, если restore завершается после размонтирования", async () => {
    let resolveRestore: () => void = () => undefined;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(failure("initial-unauthorized", 401));
    session.restore.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRestore = resolve)),
    );
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".orders-screen__retry").trigger("click");
    expect(session.restore).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    resolveRestore();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10_200);
    await flushPromises();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(
      fetcher.mock.calls.every(([, options]) => options?.method !== "POST"),
    ).toBe(true);
  });

  it("ведёт на вход после terminal restore даже при размонтированной очереди", async () => {
    let resolveRestore: () => void = () => undefined;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(failure("initial-unauthorized", 401));
    session.restore.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRestore = () => {
            session.status = "anonymous";
            resolve();
          };
        }),
    );
    const wrapper = mountQueue("/", fetcher);
    await flushPromises();

    await wrapper.get(".orders-screen__retry").trigger("click");
    wrapper.unmount();
    resolveRestore();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10_200);
    await flushPromises();

    expect(router.replace).toHaveBeenCalledWith(routePaths.login);
    expect(session.restore).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(
      fetcher.mock.calls.every(([, options]) => options?.method !== "POST"),
    ).toBe(true);
  });

  it("явно завершает mount без обязательного ApiClient provider", () => {
    expect(() => mount(QueuePage)).toThrow(
      "QueuePage requires an ApiClient provider.",
    );
  });
});
