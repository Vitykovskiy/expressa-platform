import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "@/app/session.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { ApiClient, apiClientKey } from "@/shared/api/client";
import OrderPage from "./OrderPage.vue";

const orderId = "00000000-0000-4000-8000-000000000003";

describe("OrderPage", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    Reflect.deleteProperty(navigator, "serviceWorker");
    delete (window as Window & { PushManager?: unknown }).PushManager;
  });

  it("показывает безопасный снимок заказа и оплату при выдаче", async () => {
    const { wrapper } = await mountOrder(orderResponse);

    expect(wrapper.text()).toContain("Заказ принят бариста");
    expect(wrapper.text()).toContain("Заказ №1042");
    expect(wrapper.text()).toContain("Капучино");
    expect(wrapper.text()).toContain("Размер M");
    expect(wrapper.text()).toContain("Овсяное молоко");
    expect(wrapper.text()).toMatch(/Итого560\s₽/u);
    expect(wrapper.text()).toContain("Оплата на кассе при получении");
    expect(wrapper.text()).not.toContain("Онлайн-оплата");
  });

  it("показывает оформленную стадию созданного заказа", async () => {
    const { wrapper } = await mountOrder({
      ...orderResponse,
      stage: "CREATED",
    });

    expect(wrapper.text()).toContain("Оформлен");
  });

  it("не показывает снимок при отказе API", async () => {
    const { wrapper } = await mountOrder(
      {
        code: "ACCESS_DENIED",
        details: null,
        message: "Доступ запрещён.",
        requestId: null,
      },
      403,
    );

    expect(wrapper.text()).toContain("Доступ запрещён.");
    expect(wrapper.text()).not.toContain("Капучино");
  });

  it("после подтверждения повтора заменяет корзину и открывает её", async () => {
    const { cart, router, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      menuResponse,
    );
    cart.replace([existingCartItem]);

    await wrapper.get("button").trigger("click");
    await flushPromises();
    const confirmation = wrapper
      .findAll("button")
      .find((button) => button.text() === "Заменить корзину");

    if (confirmation === undefined)
      throw new Error("Диалог повтора не открыт.");

    await confirmation.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
    expect(cart.items).toMatchObject([
      { productId: orderResponse.snapshot[0].productId },
    ]);
  });

  it("запрашивает разрешение только после явного включения уведомлений", async () => {
    const browserSubscription = createBrowserSubscription();
    const getSubscription = vi.fn().mockResolvedValue(null);
    const subscribe = vi.fn().mockResolvedValue(browserSubscription);
    installPushSupport({ getSubscription, subscribe });

    const { requests, wrapper } = await mountOrder(orderResponse);

    expect(subscribe).not.toHaveBeenCalled();

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(subscribe).toHaveBeenCalledWith({
      applicationServerKey: validVapidPublicKeyBytes,
      userVisibleOnly: true,
    });
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          headers: { authorization: "Bearer example-access-token" },
          method: "GET",
        }),
        expect.objectContaining({
          headers: {
            "content-type": "application/json",
            authorization: "Bearer example-access-token",
          },
          method: "PUT",
        }),
      ]),
    );
    expect(wrapper.text()).toContain("Отключить уведомления");
  });

  it("сохраняет заказ доступным после ошибки Push API", async () => {
    const getSubscription = vi.fn().mockResolvedValue(null);
    const subscribe = vi.fn().mockResolvedValue(createBrowserSubscription());
    installPushSupport({ getSubscription, subscribe });

    const { wrapper } = await mountOrder(orderResponse, 200, null, {
      publicKeyStatus: 500,
    });

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Заказ №1042");
    expect(wrapper.text()).toContain(
      "Не удалось изменить уведомления. Заказ останется доступен.",
    );
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("не передаёт невалидный VAPID ключ в PushManager", async () => {
    const getSubscription = vi.fn().mockResolvedValue(null);
    const subscribe = vi.fn().mockResolvedValue(createBrowserSubscription());
    installPushSupport({ getSubscription, subscribe });

    const { wrapper } = await mountOrder(orderResponse, 200, null, {
      publicKey: "AQID",
    });

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(subscribe).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "Не удалось изменить уведомления. Заказ останется доступен.",
    );
  });
});

async function mountOrder(
  response: unknown,
  status = 200,
  menu: unknown = null,
  pushOptions: PushOptions = {},
) {
  const sessionStore = useSessionStore();
  const cart = useCartStore();
  const requests: RequestInit[] = [];
  sessionStore.accessToken = "example-access-token";
  sessionStore.status = "authenticated";
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: OrderPage, path: "/orders/:id" },
      { component: { template: "<div />" }, path: "/cart" },
    ],
  });
  await router.push(`/orders/${orderId}`);
  await router.isReady();
  const wrapper = mount(OrderPage, {
    global: {
      plugins: [router],
      provide: {
        [apiClientKey as symbol]: new ApiClient({
          baseUrl: "https://api.example.test/api/v1",
          fetcher: async (url, options) => {
            const requestUrl = typeof url === "string" ? url : url.toString();
            requests.push(options ?? {});
            if (requestUrl.endsWith("/push/public-key")) {
              return new Response(
                JSON.stringify({
                  publicKey: pushOptions.publicKey ?? validVapidPublicKey,
                }),
                { status: pushOptions.publicKeyStatus ?? 200 },
              );
            }
            if (requestUrl.endsWith("/push/subscriptions")) {
              return new Response(null, {
                status: pushOptions.subscriptionStatus ?? 204,
              });
            }

            return new Response(
              JSON.stringify(requestUrl.endsWith("/menu") ? menu : response),
              { status },
            );
          },
        }),
      },
      stubs: { UiDialog: { template: "<div><slot /></div>" } },
    },
  });
  await flushPromises();
  return { cart, requests, router, wrapper };
}

function installPushSupport({
  getSubscription,
  subscribe,
}: {
  getSubscription: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
}): void {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { getSubscription, subscribe } }),
    },
  });
  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: class PushManager {},
  });
}

function createBrowserSubscription(): PushSubscription {
  return {
    endpoint: "https://push.example/subscription",
    getKey: (name: PushEncryptionKeyName) =>
      new Uint8Array(name === "auth" ? [4] : [5]).buffer,
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription;
}

type PushOptions = {
  publicKey?: unknown;
  publicKeyStatus?: number;
  subscriptionStatus?: number;
};

const validVapidPublicKey =
  "BKdrZ6EKrXOx0fbDPwF3egGVmOfYiacFCfz8g0-OG1FrCF_pmVddiHl8yPwv5kUNc9mu0vsPJgkuCwK1dbEWJ_k";
const validVapidPublicKeyBytes = new Uint8Array([
  4, 167, 107, 103, 161, 10, 173, 115, 177, 209, 246, 195, 63, 1, 119, 122, 1,
  149, 152, 231, 216, 137, 167, 5, 9, 252, 252, 131, 79, 142, 27, 81, 107, 8,
  95, 233, 153, 87, 93, 136, 121, 124, 200, 252, 47, 230, 69, 13, 115, 217, 174,
  210, 251, 15, 38, 9, 46, 11, 2, 181, 117, 177, 22, 39, 249,
]);

const orderResponse = {
  createdAt: "2026-08-16T12:00:00.000Z",
  id: orderId,
  number: "1042",
  snapshot: [
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
  stage: "ACCEPTED",
  totalMinor: 56_000,
};

const menuResponse = {
  acceptsNewOrders: true,
  categories: [
    {
      description: "",
      id: "00000000-0000-4000-8000-000000000005",
      name: "Кофе",
      products: [
        {
          description: "",
          id: orderResponse.snapshot[0].productId,
          isAvailable: true,
          modifierGroups: [],
          name: "Капучино",
          priceMinor: null,
          type: "DRINK",
          variants: [
            {
              id: orderResponse.snapshot[0].variantId,
              isAvailable: true,
              priceMinor: 56_000,
              size: "M",
            },
          ],
        },
      ],
    },
  ],
};

const existingCartItem = {
  addons: [],
  id: "existing-item",
  lineTotalMinor: 100,
  lineTotalRub: 1,
  productId: "00000000-0000-4000-8000-000000000006",
  productName: "Американо",
  quantity: 1,
  selectedModifierOptions: [],
  type: "OTHER" as const,
  unitTotalMinor: 100,
};
