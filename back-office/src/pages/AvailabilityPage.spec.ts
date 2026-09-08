import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { apiClientKey, createApiClient } from "../shared/api/client";
import type { AvailabilityItem } from "../shared/api/availability.api.types";
import AvailabilityPage from "./AvailabilityPage.vue";

vi.mock("../app/session.store", () => ({
  useSessionStore: () => ({ accessToken: "example-token" }),
}));

const categoryId = "11111111-1111-4111-8111-111111111111";
const teaCategoryId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProductId = "22222222-2222-4222-8222-222222222222";
const drinkProductId = "44444444-4444-4444-8444-444444444444";
const variantId = "55555555-5555-4555-8555-555555555555";
const modifierGroupId = "66666666-6666-4666-8666-666666666666";
const modifierId = "77777777-7777-4777-8777-777777777777";
const staffId = "33333333-3333-4333-8333-333333333333";

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function failure(code: string, message: string, requestId = "request-42") {
  return new Response(
    JSON.stringify({ code, details: null, message, requestId }),
    {
      status: 500,
    },
  );
}

function availabilityResponse(overrides: Record<string, boolean> = {}) {
  return {
    categories: [
      { id: categoryId, isActive: true, name: "Кофе", sortOrder: 0 },
      { id: teaCategoryId, isActive: true, name: "Чай", sortOrder: 1 },
    ],
    categoryModifierGroups: [
      { categoryId, groupId: modifierGroupId, sortOrder: 0 },
    ],
    intake: {
      acceptsNewOrders: true,
      updatedAt: "2030-01-01T10:00:00.000Z",
      updatedBy: staffId,
      updatedByLabel: "+79991234567",
    },
    modifierGroups: [{ id: modifierGroupId, isActive: true, name: "Молоко" }],
    modifierOptions: [
      {
        groupId: modifierGroupId,
        id: modifierId,
        isAvailable: overrides[modifierId] ?? true,
        name: "Овсяное",
        sortOrder: 0,
      },
    ],
    productVariants: [
      {
        id: variantId,
        isAvailable: overrides[variantId] ?? true,
        productId: drinkProductId,
        size: "L",
        sortOrder: 0,
      },
    ],
    products: [
      {
        categoryId,
        id: otherProductId,
        isActive: true,
        isAvailable: overrides[otherProductId] ?? true,
        name: "Завтрак",
        sortOrder: 0,
      },
      {
        categoryId,
        id: drinkProductId,
        isActive: true,
        isAvailable: overrides[drinkProductId] ?? true,
        name: "Капучино",
        sortOrder: 1,
      },
    ],
  };
}

function mountAvailability(apiBaseUrl: string, fetcher: typeof fetch) {
  return mount(AvailabilityPage, {
    global: {
      provide: {
        [apiClientKey as symbol]: createApiClient(apiBaseUrl, fetcher),
      },
    },
  });
}

function screen(wrapper: VueWrapper) {
  return wrapper.getComponent({ name: "AvailabilityScreen" });
}

function requestLog(fetcher: ReturnType<typeof vi.fn>) {
  return fetcher.mock.calls.map(([url, options]) => ({
    method: (options as RequestInit | undefined)?.method ?? "GET",
    path: url.toString(),
  }));
}

function deferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}

const itemCases = [
  {
    id: otherProductId,
    label: "Завтрак",
    name: "product OTHER",
    sublabel: "Товар",
    type: "product",
  },
  {
    id: drinkProductId,
    label: "Капучино",
    name: "product DRINK",
    sublabel: "Товар",
    type: "product",
  },
  {
    id: variantId,
    label: "Капучино · L",
    name: "variant",
    sublabel: "Размер",
    type: "variant",
  },
  {
    id: modifierId,
    label: "Молоко · Овсяное",
    name: "modifier",
    sublabel: "Добавка",
    type: "modifier",
  },
] as const;

function itemById(wrapper: VueWrapper, id: string) {
  return (
    screen(wrapper).props("groups") as {
      items: readonly AvailabilityItem[];
    }[]
  )
    .flatMap((group) => group.items)
    .find((item) => item.id === id);
}

describe("AvailabilityPage", () => {
  it("использует предоставленный origin для доступности позиции и приёма", async () => {
    const fetcher = vi.fn<typeof fetch>(async (url) => {
      const requestedUrl = url.toString();
      if (requestedUrl.endsWith("/service/intake")) {
        return response({
          acceptsNewOrders: false,
          updatedAt: "2030-01-01T10:01:00.000Z",
          updatedBy: staffId,
          updatedByLabel: "+79991234567",
        });
      }
      if (requestedUrl.includes(`/availability/product/${otherProductId}`)) {
        return response({
          id: otherProductId,
          isAvailable: false,
          type: "product",
        });
      }

      return response(availabilityResponse());
    });
    const wrapper = mountAvailability("https://api.example.test", fetcher);
    await flushPromises();

    wrapper
      .getComponent({ name: "AvailabilityScreen" })
      .vm.$emit(
        "availability-change",
        { id: otherProductId, type: "product" },
        false,
      );
    await flushPromises();
    wrapper
      .getComponent({ name: "AvailabilityScreen" })
      .vm.$emit("intake-change", false);
    await flushPromises();

    expect(fetcher.mock.calls.map(([url]) => url.toString())).toEqual([
      "https://api.example.test/api/v2/backoffice/availability",
      `https://api.example.test/api/v2/backoffice/availability/product/${otherProductId}`,
      "https://api.example.test/api/v2/backoffice/service/intake",
    ]);
    wrapper.unmount();
  });

  it("сохраняет same-origin путь предоставленного клиента", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(availabilityResponse()));
    const wrapper = mountAvailability("/", fetcher);
    await flushPromises();

    expect(fetcher.mock.calls[0]?.[0].toString()).toBe(
      "/api/v2/backoffice/availability",
    );
    wrapper.unmount();
  });

  it("явно завершает mount без обязательного ApiClient provider", () => {
    expect(() => mount(AvailabilityPage)).toThrow(
      "AvailabilityPage requires an ApiClient provider.",
    );
  });

  it.each([
    {
      code: "AVAILABILITY_READ_REJECTED",
      first: failure("AVAILABILITY_READ_REJECTED", "Сервис недоступен."),
      name: "HTTP 500",
      requestId: "request-42",
    },
    {
      code: "NETWORK_ERROR",
      first: new TypeError("network down"),
      name: "network rejection",
      requestId: null,
    },
    {
      code: "API_CONTRACT_ERROR",
      first: response({ ...availabilityResponse(), products: "invalid" }),
      name: "invalid DTO",
      requestId: null,
    },
  ])(
    "сохраняет read provenance для initial GET %s и восстанавливает только GET",
    async ({ code, first, requestId }) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockImplementationOnce(() =>
          first instanceof Error
            ? Promise.reject(first)
            : Promise.resolve(first),
        )
        .mockResolvedValueOnce(response(availabilityResponse()));
      const wrapper = mountAvailability("/", fetcher);
      await flushPromises();

      expect(screen(wrapper).props("error")).toMatchObject({
        code,
        kind: "read",
        requestId,
      });
      await wrapper.get(".availability-screen__error button").trigger("click");
      await flushPromises();

      expect(requestLog(fetcher)).toEqual([
        { method: "GET", path: "/api/v2/backoffice/availability" },
        { method: "GET", path: "/api/v2/backoffice/availability" },
      ]);
      expect(screen(wrapper).props("error")).toBeNull();
      wrapper.unmount();
    },
  );

  it.each(itemCases)(
    "подтверждает acknowledged availability для $name",
    async (item) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(availabilityResponse()))
        .mockResolvedValueOnce(
          response({ id: item.id, isAvailable: false, type: item.type }),
        );
      const wrapper = mountAvailability("/", fetcher);
      await flushPromises();

      screen(wrapper).vm.$emit(
        "availability-change",
        { id: item.id, type: item.type },
        false,
      );
      await flushPromises();

      expect(itemById(wrapper, item.id)?.isAvailable).toBe(false);
      expect(requestLog(fetcher)).toEqual([
        { method: "GET", path: "/api/v2/backoffice/availability" },
        {
          method: "PATCH",
          path: `/api/v2/backoffice/availability/${item.type}/${item.id}`,
        },
      ]);
      wrapper.unmount();
    },
  );

  it("подтверждает acknowledged intake", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(availabilityResponse()))
      .mockResolvedValueOnce(
        response({
          acceptsNewOrders: false,
          updatedAt: "2030-01-01T10:01:00.000Z",
          updatedBy: staffId,
          updatedByLabel: "+79990000000",
        }),
      );
    const wrapper = mountAvailability("/", fetcher);
    await flushPromises();

    screen(wrapper).vm.$emit("intake-change", false);
    await flushPromises();

    expect(screen(wrapper).props("intake")).toMatchObject({
      acceptsNewOrders: false,
      updatedAt: "2030-01-01T10:01:00.000Z",
      updatedByLabel: "+79990000000",
    });
    expect(requestLog(fetcher)).toEqual([
      { method: "GET", path: "/api/v2/backoffice/availability" },
      { method: "PATCH", path: "/api/v2/backoffice/service/intake" },
    ]);
    wrapper.unmount();
  });

  it.each(itemCases)(
    "откатывает полный snapshot и сохраняет item provenance после failed PATCH $name",
    async (item) => {
      const patch = deferred<Response>();
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(availabilityResponse()))
        .mockImplementationOnce(() => patch.promise);
      const wrapper = mountAvailability("/", fetcher);
      await flushPromises();
      const before = screen(wrapper).props("groups");

      screen(wrapper).vm.$emit(
        "availability-change",
        itemById(wrapper, item.id)!,
        false,
      );
      await flushPromises();

      expect(itemById(wrapper, item.id)?.isAvailable).toBe(false);
      expect(screen(wrapper).props("saving")).toBe(true);
      expect(
        wrapper
          .findAll('[role="switch"]')
          .every((toggle) => toggle.element.hasAttribute("disabled")),
      ).toBe(true);
      patch.resolve(
        failure("AVAILABILITY_UPDATE_REJECTED", "Изменение отклонено."),
      );
      await flushPromises();

      expect(screen(wrapper).props("groups")).toEqual(before);
      expect(screen(wrapper).props("error")).toMatchObject({
        code: "AVAILABILITY_UPDATE_REJECTED",
        kind: "item",
        label: item.label,
        sublabel: item.sublabel,
      });
      expect(requestLog(fetcher)).toEqual([
        { method: "GET", path: "/api/v2/backoffice/availability" },
        {
          method: "PATCH",
          path: `/api/v2/backoffice/availability/${item.type}/${item.id}`,
        },
      ]);
      wrapper.unmount();
    },
  );

  it("откатывает intake snapshot и сохраняет intake provenance после failed PATCH", async () => {
    const patch = deferred<Response>();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(availabilityResponse()))
      .mockImplementationOnce(() => patch.promise);
    const wrapper = mountAvailability("/", fetcher);
    await flushPromises();
    const before = screen(wrapper).props("intake");

    screen(wrapper).vm.$emit("intake-change", false);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(screen(wrapper).props("intake")).toMatchObject({
      acceptsNewOrders: false,
    });
    expect(screen(wrapper).props("saving")).toBe(true);
    expect(
      wrapper
        .findAll('[role="switch"]')
        .every((toggle) => toggle.element.hasAttribute("disabled")),
    ).toBe(true);
    patch.resolve(failure("INTAKE_UPDATE_REJECTED", "Приём не изменён."));
    await flushPromises();

    expect(screen(wrapper).props("intake")).toEqual(before);
    expect(screen(wrapper).props("error")).toMatchObject({
      code: "INTAKE_UPDATE_REJECTED",
      kind: "intake",
    });
    expect(requestLog(fetcher)).toEqual([
      { method: "GET", path: "/api/v2/backoffice/availability" },
      { method: "PATCH", path: "/api/v2/backoffice/service/intake" },
    ]);
    wrapper.unmount();
  });

  it("сохраняет captured item label и sublabel после поиска и смены категории", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(availabilityResponse()))
      .mockResolvedValueOnce(
        failure("AVAILABILITY_UPDATE_REJECTED", "Изменение отклонено."),
      );
    const wrapper = mountAvailability("/", fetcher);
    await flushPromises();

    screen(wrapper).vm.$emit(
      "availability-change",
      itemById(wrapper, otherProductId)!,
      false,
    );
    await flushPromises();
    await wrapper.get('input[type="search"]').setValue("нет совпадений");
    await wrapper
      .findAll(".filter-tab")
      .find((tab) => tab.text() === "Чай")!
      .trigger("click");

    expect(wrapper.text()).toContain("Позиция: «Завтрак», Товар");
    expect(screen(wrapper).props("error")).toMatchObject({
      label: "Завтрак",
      sublabel: "Товар",
    });
    wrapper.unmount();
  });

  it("не выпускает retry или вторую mutation, пока PATCH pending", async () => {
    const patch = deferred<Response>();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(availabilityResponse()))
      .mockImplementationOnce(() => patch.promise);
    const wrapper = mountAvailability("/", fetcher);
    await flushPromises();

    screen(wrapper).vm.$emit(
      "availability-change",
      itemById(wrapper, otherProductId)!,
      false,
    );
    await flushPromises();
    screen(wrapper).vm.$emit("retry");
    screen(wrapper).vm.$emit("intake-change", false);
    screen(wrapper).vm.$emit(
      "availability-change",
      itemById(wrapper, drinkProductId)!,
      false,
    );
    await flushPromises();

    expect(requestLog(fetcher)).toEqual([
      { method: "GET", path: "/api/v2/backoffice/availability" },
      {
        method: "PATCH",
        path: `/api/v2/backoffice/availability/product/${otherProductId}`,
      },
    ]);
    patch.resolve(
      response({ id: otherProductId, isAvailable: false, type: "product" }),
    );
    await flushPromises();
    wrapper.unmount();
  });

  it.each(["initial", "recovery"])(
    "не выпускает PATCH, пока %s GET pending",
    async (phase) => {
      const get = deferred<Response>();
      const fetcher = vi.fn<typeof fetch>();
      if (phase === "initial") {
        fetcher.mockImplementationOnce(() => get.promise);
      } else {
        fetcher
          .mockResolvedValueOnce(response(availabilityResponse()))
          .mockImplementationOnce(() => get.promise);
      }
      const wrapper = mountAvailability("/", fetcher);
      await flushPromises();
      if (phase === "recovery") {
        screen(wrapper).vm.$emit("retry");
        await flushPromises();
      }

      screen(wrapper).vm.$emit(
        "availability-change",
        itemById(wrapper, otherProductId)!,
        false,
      );
      screen(wrapper).vm.$emit("intake-change", false);
      await flushPromises();

      expect(requestLog(fetcher)).toEqual(
        Array.from({ length: phase === "initial" ? 1 : 2 }, () => ({
          method: "GET",
          path: "/api/v2/backoffice/availability",
        })),
      );
      get.resolve(response(availabilityResponse()));
      await flushPromises();
      wrapper.unmount();
    },
  );

  it.each([
    { authoritative: true, name: "prior authoritative value" },
    { authoritative: false, name: "requested authoritative value" },
  ])(
    "восстанавливает $name после lost acknowledgement одним GET без PATCH replay",
    async ({ authoritative }) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(availabilityResponse()))
        .mockResolvedValueOnce(
          failure("AVAILABILITY_UPDATE_REJECTED", "Подтверждение потеряно."),
        )
        .mockResolvedValueOnce(
          response(availabilityResponse({ [otherProductId]: authoritative })),
        );
      const wrapper = mountAvailability("/", fetcher);
      await flushPromises();

      screen(wrapper).vm.$emit(
        "availability-change",
        itemById(wrapper, otherProductId)!,
        false,
      );
      await flushPromises();
      await wrapper.get(".availability-screen__error button").trigger("click");
      await flushPromises();

      expect(itemById(wrapper, otherProductId)?.isAvailable).toBe(
        authoritative,
      );
      expect(requestLog(fetcher)).toEqual([
        { method: "GET", path: "/api/v2/backoffice/availability" },
        {
          method: "PATCH",
          path: `/api/v2/backoffice/availability/product/${otherProductId}`,
        },
        { method: "GET", path: "/api/v2/backoffice/availability" },
      ]);
      wrapper.unmount();
    },
  );
});
