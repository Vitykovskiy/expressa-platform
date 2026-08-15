import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "@/app/session.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { ApiClient, apiClientKey } from "@/shared/api/client";
import OrderPage from "./OrderPage.vue";

const orderId = "00000000-0000-4000-8000-000000000003";

describe("OrderPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

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
});

async function mountOrder(
  response: unknown,
  status = 200,
  menu: unknown = null,
) {
  const sessionStore = useSessionStore();
  const cart = useCartStore();
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
          fetcher: async (url) => {
            const requestUrl = typeof url === "string" ? url : url.toString();

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
  return { cart, router, wrapper };
}

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
