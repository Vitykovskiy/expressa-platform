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
    vi.useRealTimers();
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
    expect(wrapper.text()).toContain("Ожидаем подтверждения бариста.");
    expect(wrapper.get("h1").text()).toBe("Оформлен");
  });

  it("показывает готовность к выдаче как следующий поддержанный шаг", async () => {
    const { wrapper } = await mountOrder({
      ...orderResponse,
      stage: "READY",
    });

    expect(wrapper.get("h1").text()).toBe("Заказ готов к выдаче");
    expect(wrapper.text()).toContain("Можно забрать заказ на кассе.");
  });

  it("не показывает снимок и технический текст при отказе API", async () => {
    const { wrapper } = await mountOrder(
      {
        code: "ACCESS_DENIED",
        details: null,
        message: "Доступ запрещён.",
        requestId: null,
      },
      403,
    );

    expect(wrapper.text()).toContain("Не удалось загрузить заказ.");
    expect(wrapper.text()).not.toContain("Доступ запрещён.");
    expect(wrapper.text()).not.toContain("Капучино");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Повторить"),
    ).toHaveLength(1);
  });

  it("показывает каноническую недоступность для отсутствующего заказа", async () => {
    const { wrapper } = await mountOrder(
      {
        code: "ORDER_NOT_FOUND",
        details: null,
        message: "Заказ не найден.",
        requestId: null,
      },
      404,
    );

    expect(wrapper.text()).toContain("Заказ недоступен.");
    expect(wrapper.text()).not.toContain("Заказ не найден.");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Повторить"),
    ).toHaveLength(0);
    expect(wrapper.text()).toContain("К истории заказов");
    expect(wrapper.text()).toContain("Перейти в меню");
  });

  it.each([
    [
      {
        code: "SERVER_ERROR",
        details: null,
        message: "database trace",
        requestId: null,
      },
      503,
    ],
    [{ invalid: "contract" }, 200],
  ])("безопасно переводит начальную ошибку %j", async (response, status) => {
    const { wrapper } = await mountOrder(response, status);

    expect(wrapper.text()).toContain("Не удалось загрузить заказ.");
    expect(wrapper.text()).not.toContain("database trace");
    expect(wrapper.text()).not.toContain("API_CONTRACT_ERROR");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Повторить"),
    ).toHaveLength(1);
  });

  it("не показывает технический текст при сетевом сбое первой загрузки", async () => {
    const { wrapper } = await mountOrder(orderResponse, 200, null, {
      detailReplies: [Promise.reject(new Error("socket ECONNRESET"))],
    });

    expect(wrapper.text()).toContain("Не удалось загрузить заказ.");
    expect(wrapper.text()).not.toContain("socket ECONNRESET");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Повторить"),
    ).toHaveLength(1);
  });

  it("не дублирует начальный GET и восстанавливает снимок одной повторной попыткой", async () => {
    const deferred = createDeferred<Response>();
    const { detailRequests, wrapper } = await mountOrder(
      {
        code: "SERVER_ERROR",
        details: null,
        message: "raw error",
        requestId: null,
      },
      503,
      null,
      { detailReplies: [deferred.promise, detailResponse(orderResponse)] },
    );
    await flushPromises();

    expect(wrapper.text()).toContain("Загружаем заказ");
    expect(detailRequests).toHaveLength(1);
    deferred.resolve(
      detailResponse(
        {
          code: "SERVER_ERROR",
          details: null,
          message: "raw error",
          requestId: null,
        },
        503,
      ),
    );
    await flushPromises();
    const retry = getButtonByText(wrapper, "Повторить");

    await retry.trigger("click");
    await retry.trigger("click");
    await flushPromises();

    expect(detailRequests).toHaveLength(2);
    expect(wrapper.text()).toContain("Заказ №1042");
  });

  it("сохраняет снимок и останавливает polling после ошибки фонового обновления", async () => {
    vi.useFakeTimers();
    const { detailRequests, wrapper } = await mountOrder(
      orderResponse,
      200,
      null,
      {
        detailReplies: [
          detailResponse(orderResponse),
          detailResponse(
            {
              code: "SERVER_ERROR",
              details: null,
              message: "raw error",
              requestId: null,
            },
            503,
          ),
        ],
      },
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();

    expect(wrapper.text()).toContain("Заказ №1042");
    expect(wrapper.text()).toContain("Не удалось обновить заказ.");
    expect(wrapper.text()).toContain("Показаны последние доступные данные.");
    expect(
      wrapper
        .findAll("button")
        .filter((button) => button.text() === "Повторить обновление"),
    ).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(detailRequests).toHaveLength(2);
  });

  it("удерживает один точный GET при таймере и ручном восстановлении", async () => {
    vi.useFakeTimers();
    const deferredRecovery = createDeferred<Response>();
    const refreshFailure = {
      code: "SERVER_ERROR",
      details: null,
      message: "raw error",
      requestId: null,
    };
    const { detailRequests, wrapper } = await mountOrder(
      orderResponse,
      200,
      null,
      {
        detailReplies: [
          detailResponse(orderResponse),
          detailResponse(refreshFailure, 503),
          deferredRecovery.promise,
          detailResponse(orderResponse),
        ],
      },
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();
    const recovery = getButtonByText(wrapper, "Повторить обновление");

    await recovery.trigger("click");
    await flushPromises();

    expect(detailRequests).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(20_000);
    await recovery.trigger("click");
    await flushPromises();

    expect(detailRequests).toHaveLength(3);
    deferredRecovery.resolve(detailResponse(orderResponse));
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(detailRequests).toHaveLength(4);
  });

  it("не учитывает menu-запрос как чтение деталей заказа", async () => {
    const { detailRequests, wrapper } = await mountOrder(
      {
        ...orderResponse,
        stage: "ISSUED",
      },
      200,
      menuResponse,
    );

    await getButtonByText(wrapper, "Повторить заказ").trigger("click");
    await flushPromises();

    expect(detailRequests).toEqual([
      { method: "GET", path: `/api/v2/orders/${orderId}` },
    ]);
  });

  it("учитывает чтение только для точного endpoint текущего маршрута", async () => {
    const nextOrderId = "00000000-0000-4000-8000-000000000099";
    const { detailRequests, router } = await mountOrder(
      orderResponse,
      200,
      null,
      {
        detailReplies: [
          detailResponse(orderResponse),
          detailResponse({ ...orderResponse, id: nextOrderId, number: "2048" }),
        ],
      },
    );

    await router.push(`/orders/${nextOrderId}?from=history`);
    await flushPromises();

    expect(detailRequests).toEqual([
      { method: "GET", path: `/api/v2/orders/${orderId}` },
      { method: "GET", path: `/api/v2/orders/${nextOrderId}` },
    ]);
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

  it("передаёт диалогу контекстное имя и фактический trigger повтора", async () => {
    const { cart, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      menuResponse,
    );
    cart.replace([existingCartItem]);
    const repeat = getButtonByText(wrapper, "Повторить заказ");

    await repeat.trigger("click");
    await flushPromises();

    const dialog = wrapper.getComponent({ name: "UiDialog" });
    expect(dialog.props("label")).toBe("Подтверждение замены корзины");
    expect(dialog.props("returnFocusTo").$el).toBe(repeat.element);
  });

  it("защищает повтор от повторной активации до завершения menu read", async () => {
    const deferredMenu = createDeferred<Response>();
    const { menuRequests, router, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      menuResponse,
      { menuReplies: [deferredMenu.promise] },
    );
    const repeat = getButtonByText(wrapper, "Повторить заказ");

    await repeat.trigger("click");
    await repeat.trigger("click");
    await flushPromises();

    expect(menuRequests).toHaveLength(1);
    expect(repeat.attributes("disabled")).toBeDefined();
    expect(repeat.attributes("aria-busy")).toBe("true");
    expect(wrapper.find('[role="status"]').text()).toContain(
      "Проверяем доступность позиций…",
    );

    deferredMenu.resolve(detailResponse(menuResponse));
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
  });

  it("снимает защиту повтора после ошибки menu read", async () => {
    const deferredMenu = createDeferred<Response>();
    const { menuRequests, wrapper } = await mountOrder(
      { ...orderResponse, stage: "ISSUED" },
      200,
      menuResponse,
      { menuReplies: [deferredMenu.promise] },
    );
    const repeat = getButtonByText(wrapper, "Повторить заказ");

    await repeat.trigger("click");
    await flushPromises();
    deferredMenu.resolve(detailResponse({ code: "SERVER_ERROR" }, 503));
    await flushPromises();

    expect(menuRequests).toHaveLength(1);
    expect(repeat.attributes("disabled")).toBeUndefined();
    expect(repeat.attributes("aria-busy")).toBeUndefined();
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
    expect(cart.repeatResult).toEqual({
      addedPositionCount: 1,
      requestedPositionCount: 2,
    });
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
    expect(cart.repeatResult).toEqual({
      addedPositionCount: 0,
      requestedPositionCount: 1,
    });
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

  it("ведёт к единственной настройке уведомлений в истории", async () => {
    const { wrapper } = await mountOrder(orderResponse);

    expect(wrapper.text()).toContain("Настроить уведомления");
    expect(wrapper.text()).not.toContain("Включить уведомления");
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
  const menuRequests: RequestInit[] = [];
  const detailRequests: Array<{ method: string; path: string }> = [];
  const detailReplies = [...(pushOptions.detailReplies ?? [])];
  const menuReplies = [...(pushOptions.menuReplies ?? [])];
  const subscriptionReplies = [...(pushOptions.subscriptionReplies ?? [])];
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
              if (pushOptions.publicKeyReply !== undefined)
                return await pushOptions.publicKeyReply;
              return new Response(
                JSON.stringify({
                  publicKey: pushOptions.publicKey ?? validVapidPublicKey,
                }),
                { status: pushOptions.publicKeyStatus ?? 200 },
              );
            }
            if (requestUrl.endsWith("/push/subscriptions")) {
              const reply = subscriptionReplies.shift();
              if (reply !== undefined) return await reply;
              return new Response(null, {
                status: pushOptions.subscriptionStatus ?? 204,
              });
            }

            const path = new URL(requestUrl).pathname;
            const method = options?.method?.toUpperCase() ?? "GET";
            const currentOrderId = router.currentRoute.value.params.id;
            if (
              typeof currentOrderId === "string" &&
              isCurrentDetailRequest(method, path, currentOrderId)
            ) {
              detailRequests.push({ method, path });
              const reply = detailReplies.shift();
              if (reply !== undefined) return await reply;
            }

            if (requestUrl.endsWith("/menu")) {
              menuRequests.push(options ?? {});
              const reply = menuReplies.shift();
              if (reply !== undefined) return await reply;
            }

            return new Response(
              JSON.stringify(requestUrl.endsWith("/menu") ? menu : response),
              { status },
            );
          },
        }),
      },
      stubs: {
        UiBtn: {
          name: "UiBtn",
          emits: ["click"],
          props: ["disabled", "loading", "to", "type"],
          template:
            '<button :aria-busy="loading || undefined" :disabled="disabled || loading" :type="type" @click="$emit(\'click\', $event)"><slot /></button>',
        },
        UiDialog: {
          name: "UiDialog",
          props: ["label", "modelValue", "returnFocusTo"],
          template:
            '<div v-if="modelValue" class="ui-dialog-stub"><slot /></div>',
        },
      },
    },
  });
  await flushPromises();
  return { cart, detailRequests, menuRequests, requests, router, wrapper };
}

function getButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll("button").find((item) => item.text() === text);

  if (button === undefined) throw new Error(`Кнопка «${text}» не найдена.`);

  return button;
}

function isCurrentDetailRequest(
  method: string,
  pathname: string,
  currentOrderId: string,
): boolean {
  return method === "GET" && pathname === `/api/v2/orders/${currentOrderId}`;
}

type PushOptions = {
  publicKeyReply?: Response | Promise<Response>;
  subscriptionReplies?: Array<Response | Promise<Response>>;
  detailReplies?: Array<Response | Promise<Response>>;
  menuReplies?: Array<Response | Promise<Response>>;
  publicKey?: unknown;
  publicKeyStatus?: number;
  subscriptionStatus?: number;
};

function detailResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

type MenuVariant = {
  id: string;
  isAvailable: boolean;
  price: number;
  size: "S" | "M" | "L";
};

const validVapidPublicKey =
  "BKdrZ6EKrXOx0fbDPwF3egGVmOfYiacFCfz8g0-OG1FrCF_pmVddiHl8yPwv5kUNc9mu0vsPJgkuCwK1dbEWJ_k";
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
