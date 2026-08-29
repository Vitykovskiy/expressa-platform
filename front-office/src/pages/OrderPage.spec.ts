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
    expect(cart.repeatWarnings).toEqual([]);
  });

  it("повторяет полный заказ в пустую корзину по текущей цене", async () => {
    const repeatedItem = {
      ...orderResponse.snapshot[0],
      quantity: 3,
      size: "S" as const,
      variantId: "00000000-0000-4000-8000-000000000008",
    };
    const menu = createMenu({
      price: 720,
      variants: [
        {
          id: repeatedItem.variantId,
          isAvailable: true,
          price: 720,
          size: "S",
        },
      ],
    });
    const { cart, router, wrapper } = await mountOrder(
      { ...orderResponse, snapshot: [repeatedItem], stage: "ISSUED" },
      200,
      menu,
    );

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
    expect(cart.items).toEqual([
      {
        addons: [
          {
            id: orderResponse.snapshot[0].modifiers[0].modifierOptionId,
            name: "Овсяное молоко",
            priceRub: 60,
          },
        ],
        id: "repeat-0",
        lineTotal: 2_340,
        lineTotalRub: 2_340,
        productId: orderResponse.snapshot[0].productId,
        productName: "Капучино",
        quantity: 3,
        selectedModifierOptions: [
          {
            groupId: "00000000-0000-4000-8000-000000000010",
            id: orderResponse.snapshot[0].modifiers[0].modifierOptionId,
            name: "Овсяное молоко",
            priceDelta: 60,
          },
        ],
        selectedVariant: {
          id: repeatedItem.variantId,
          price: 720,
          size: "S",
        },
        size: "S",
        sizePrice: 720,
        type: "DRINK",
        unitTotal: 780,
      },
    ]);
    expect(cart.repeatWarnings).toEqual([]);
  });

  it("повторяет доступные позиции и сохраняет предупреждение о недоступном товаре", async () => {
    const unavailableItem = {
      ...orderResponse.snapshot[0],
      productId: "00000000-0000-4000-8000-000000000007",
      productName: "Чизкейк",
      variantId: null,
      size: null,
      modifiers: [],
    };
    const { cart, router, wrapper } = await mountOrder(
      {
        ...orderResponse,
        snapshot: [orderResponse.snapshot[0], unavailableItem],
        stage: "ISSUED",
      },
      200,
      menuResponse,
    );

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
    expect(cart.items).toHaveLength(1);
    expect(cart.repeatWarnings).toEqual([
      {
        productName: "Чизкейк",
        reason: "Товар больше недоступен.",
      },
    ]);
  });

  it("не заменяет непустую корзину, если повторить нечего", async () => {
    const { cart, router, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      createMenu({ isAvailable: false }),
    );
    cart.replace([existingCartItem]);

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
    expect(cart.items).toEqual([existingCartItem]);
    expect(cart.repeatWarnings).toEqual([
      {
        productName: "Капучино",
        reason: "Товар больше недоступен.",
      },
    ]);
    expect(wrapper.text()).not.toContain("Заменить корзину?");
  });

  it("оставляет непустую корзину без изменений при отмене повтора", async () => {
    const { cart, router, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      menuResponse,
    );
    cart.replace([existingCartItem]);

    await wrapper.get("button").trigger("click");
    await flushPromises();
    await getButtonByText(wrapper, "Отмена").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe(`/orders/${orderId}`);
    expect(cart.items).toEqual([existingCartItem]);
    expect(cart.repeatWarnings).toEqual([]);
  });

  it("различает недоступные конфигурации одинакового товара", async () => {
    const firstItem = {
      ...orderResponse.snapshot[0],
      size: "S" as const,
      variantId: "00000000-0000-4000-8000-000000000008",
    };
    const secondItem = {
      ...orderResponse.snapshot[0],
      size: "M" as const,
    };
    const { cart, router, wrapper } = await mountOrder(
      {
        ...orderResponse,
        snapshot: [firstItem, secondItem],
        stage: "ISSUED",
      },
      200,
      createMenu({
        variants: [
          {
            id: "00000000-0000-4000-8000-000000000009",
            isAvailable: true,
            price: 800,
            size: "L",
          },
        ],
      }),
    );

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
    expect(cart.repeatWarnings).toEqual([
      {
        context: "Размер S, Овсяное молоко",
        productName: "Капучино",
        reason: "Выбранная конфигурация больше недоступна.",
      },
      {
        context: "Размер M, Овсяное молоко",
        productName: "Капучино",
        reason: "Выбранная конфигурация больше недоступна.",
      },
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
          baseUrl: "https://api.example.test/api/v2",
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

function getButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll("button").find((item) => item.text() === text);

  if (button === undefined) throw new Error(`Кнопка «${text}» не найдена.`);

  return button;
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

type MenuVariant = {
  id: string;
  isAvailable: boolean;
  price: number;
  size: "S" | "M" | "L";
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
      lineTotal: 560,
      modifiers: [
        {
          modifierName: "Овсяное молоко",
          modifierOptionId: "00000000-0000-4000-8000-000000000004",
          priceDelta: 60,
        },
      ],
      productId: "00000000-0000-4000-8000-000000000001",
      productName: "Капучино",
      quantity: 1,
      size: "M",
      unitTotal: 560,
      variantId: "00000000-0000-4000-8000-000000000002",
    },
  ],
  stage: "ACCEPTED",
  total: 560,
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
          modifierGroups: [
            {
              id: "00000000-0000-4000-8000-000000000010",
              maxSelect: 1,
              minSelect: 0,
              name: "Молоко",
              options: [
                {
                  id: orderResponse.snapshot[0].modifiers[0].modifierOptionId,
                  isAvailable: true,
                  isDefault: false,
                  name: "Овсяное молоко",
                  priceDelta: 60,
                },
              ],
              selectionType: "single",
            },
          ],
          name: "Капучино",
          price: null,
          type: "DRINK",
          variants: [
            {
              id: orderResponse.snapshot[0].variantId,
              isAvailable: true,
              price: 560,
              size: "M",
            },
          ],
        },
      ],
    },
  ],
};

function createMenu({
  isAvailable = true,
  price = 560,
  variants = defaultMenuVariants,
}: {
  isAvailable?: boolean;
  price?: number;
  variants?: MenuVariant[];
}) {
  return {
    ...menuResponse,
    categories: [
      {
        ...menuResponse.categories[0],
        products: [
          {
            ...menuResponse.categories[0].products[0],
            isAvailable,
            variants: variants.map((variant) => ({ ...variant, price })),
          },
        ],
      },
    ],
  };
}

const defaultMenuVariants: MenuVariant[] = [
  {
    id: orderResponse.snapshot[0].variantId,
    isAvailable: true,
    price: 560,
    size: "M",
  },
];

const existingCartItem = {
  addons: [],
  id: "existing-item",
  lineTotal: 100,
  lineTotalRub: 1,
  productId: "00000000-0000-4000-8000-000000000006",
  productName: "Американо",
  quantity: 1,
  selectedModifierOptions: [],
  type: "OTHER" as const,
  unitTotal: 100,
};
