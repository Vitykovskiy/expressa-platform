import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import { useSessionStore } from "@/app/session.store";
import { setSessionDependencies } from "@/app/session.store.dependencies";
import { ApiClient, apiClientKey } from "@/shared/api/client";
import OrdersPage from "./OrdersPage.vue";

const customer = {
  id: "customer-1",
  phoneE164: "+79991234567",
  role: "customer" as const,
};
const accessSession = {
  accessToken: "restored-token",
  expiresInSeconds: 900,
  tokenType: "Bearer" as const,
};

describe("OrdersPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn().mockResolvedValue(customer),
        logout: vi.fn(),
        refresh: vi.fn().mockResolvedValue(accessSession),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 0),
    });
  });

  it("передаёт загруженную историю в экран", async () => {
    const { wrapper } = await mountOrders(() => ordersResponse());

    expect(wrapper.text()).toContain("1042");
  });

  it("не повторяет GET истории после размонтирования во время восстановления", async () => {
    const restored = createDeferred<typeof accessSession>();
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn().mockResolvedValue(customer),
        logout: vi.fn(),
        refresh: vi.fn(() => restored.promise),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 0),
    });
    const requests: string[] = [];
    const { wrapper } = await mountOrders(() => {
      requests.push("GET");
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          details: null,
          message: "",
          requestId: null,
        }),
        { status: 401 },
      );
    });

    await flushPromises();
    wrapper.unmount();
    restored.resolve(accessSession);
    await flushPromises();

    expect(requests).toHaveLength(1);
  });

  it("показывает retry после временного восстановления и загружает историю только после новой сессии", async () => {
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn().mockResolvedValue(customer),
        logout: vi.fn(),
        refresh: vi
          .fn()
          .mockRejectedValueOnce(new Error("network"))
          .mockResolvedValueOnce(accessSession),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 0),
    });
    let requestCount = 0;
    const { wrapper } = await mountOrders(() => {
      requestCount += 1;
      if (requestCount === 1)
        return new Response(
          JSON.stringify({
            code: "UNAUTHORIZED",
            details: null,
            message: "",
            requestId: null,
          }),
          { status: 401 },
        );
      return ordersResponse();
    });

    expect(wrapper.text()).toContain("Не удалось загрузить историю заказов.");
    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(requestCount).toBe(2);
    expect(wrapper.text()).toContain("1042");
  });
});

async function mountOrders(reply: () => Response) {
  const store = useSessionStore();
  store.accessToken = "current-token";
  store.currentUser = customer;
  store.status = "authenticated";
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: OrdersPage, path: "/orders" }],
  });
  await router.push("/orders");
  await router.isReady();
  const wrapper = mount(OrdersPage, {
    global: {
      plugins: [router],
      provide: {
        [apiClientKey as symbol]: new ApiClient({
          baseUrl: "https://api.example.test/api/v2",
          fetcher: async () => reply(),
        }),
      },
      stubs: {
        OrdersHistoryScreen: {
          emits: ["retry"],
          props: ["errorMessage", "orders"],
          template:
            '<section>{{ errorMessage }}{{ orders.map((order) => order.number).join(",") }}<button v-if="errorMessage" @click="$emit(\'retry\')">Повторить</button></section>',
        },
      },
    },
  });
  await flushPromises();
  return { wrapper };
}

function ordersResponse(): Response {
  return new Response(
    JSON.stringify({
      nextCursor: null,
      orders: [
        {
          createdAt: "2026-09-13T00:00:00.000Z",
          id: "00000000-0000-4000-8000-000000000001",
          number: "1042",
          snapshot: [],
          stage: "ACCEPTED",
          total: 280,
        },
      ],
    }),
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
