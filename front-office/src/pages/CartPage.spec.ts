import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "../app/session.store";
import {
  checkoutErrorCodes,
  checkoutStatuses,
} from "@/features/checkout/checkout.store.constants";
import { setCheckoutStoreDependencies } from "@/features/checkout/checkout.store.dependencies";
import { useCheckoutStore } from "@/features/checkout/checkout.store";
import { useCartStore } from "@/entities/customer/model/cart.store";
import type { RepeatWarning } from "@/entities/customer/model/cart.store.types";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import CartPage from "./CartPage.vue";

vi.mock("@/features/checkout/CartScreen.vue", () => ({
  default: {
    emits: [
      "checkout",
      "continueShopping",
      "reconfirm",
      "removeItem",
      "updateQuantity",
    ],
    props: [
      "acceptsNewOrders",
      "checkoutState",
      "errorMessage",
      "items",
      "reconfirmedTotalRub",
      "repeatWarnings",
      "unavailableItemIds",
    ],
    template: `
      <div>
        <button data-test="checkout" @click="$emit('checkout')" />
        <button data-test="reconfirm" @click="$emit('reconfirm')" />
        <button data-test="remove" @click="$emit('removeItem', 'item')" />
        <button data-test="quantity" @click="$emit('updateQuantity', 'item', 2)" />
      </div>
    `,
  },
}));

describe("CartPage", () => {
  const createOrder = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    createOrder.mockReset();
    setCheckoutStoreDependencies({
      createIdempotencyKey: () => "checkout-key",
      ordersApi: { createOrder },
    });
  });

  it("сохраняет корзину гостя и открывает вход с безопасным returnTo", async () => {
    const { cart, router, wrapper } = await mountPage();

    await wrapper.get('[data-test="checkout"]').trigger("click");

    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe("/auth/phone"),
    );
    expect(router.currentRoute.value.query.returnTo).toBe("/cart");
    expect(cart.items).toHaveLength(1);
  });

  it("изменяет количество и удаляет позицию через cart store", async () => {
    const { cart, wrapper } = await mountPage();
    cart.applyRepeat([], [createRepeatWarning()]);

    await wrapper.get('[data-test="quantity"]').trigger("click");
    expect(cart.items[0]?.quantity).toBe(2);
    expect(cart.items[0]?.lineTotalRub).toBe(8);
    expect(cart.repeatWarnings).toEqual([]);

    cart.applyRepeat([], [createRepeatWarning()]);
    await wrapper.get('[data-test="remove"]').trigger("click");
    expect(cart.items).toEqual([]);
    expect(cart.repeatWarnings).toEqual([]);
  });

  it("передаёт предупреждения повтора в CartScreen после перехода в корзину", async () => {
    const warnings = [
      createRepeatWarning(),
      {
        ...createRepeatWarning(),
        reason: "Выбранная конфигурация больше недоступна.",
      },
    ];
    const { wrapper } = await mountPage(warnings);

    expect(wrapper.findComponent({ name: "CartScreen" }).props()).toMatchObject(
      { repeatWarnings: warnings },
    );
  });

  it("очищает предупреждения только после ухода с корзины", async () => {
    const { cart, router, wrapper } = await mountPage();
    cart.applyRepeat([], [createRepeatWarning()]);
    await wrapper.vm.$nextTick();

    expect(cart.repeatWarnings).toHaveLength(1);
    await router.push("/menu");
    expect(cart.repeatWarnings).toEqual([]);
  });

  it("оформляет заказ, очищает корзину и открывает точный маршрут заказа", async () => {
    const order = createOrderResult();
    createOrder.mockResolvedValue(order);
    const { cart, router, session, wrapper } = await mountPage();
    authenticate(session);

    await wrapper.get('[data-test="checkout"]').trigger("click");

    await vi.waitFor(() => expect(cart.items).toEqual([]));
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.path).toBe(`/orders/${order.id}`);
  });

  it("повторяет сетевой запрос через checkout store", async () => {
    const { checkout, session, wrapper } = await mountPage();
    authenticate(session);
    checkout.errorCode = checkoutErrorCodes.network;
    const retry = vi.spyOn(checkout, "retry").mockResolvedValue(null);

    await wrapper.get('[data-test="checkout"]').trigger("click");

    expect(retry).toHaveBeenCalledWith("access-token");
  });

  it("передаёт новый итог и выполняет явное повторное подтверждение", async () => {
    const { checkout, session, wrapper } = await mountPage();
    authenticate(session);
    checkout.status = checkoutStatuses.reconfirmationRequired;
    checkout.reconfirmedTotalMinor = 720;
    const reconfirm = vi.spyOn(checkout, "reconfirm").mockResolvedValue(null);
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: "CartScreen" }).props()).toMatchObject(
      {
        checkoutState: checkoutStatuses.reconfirmationRequired,
        reconfirmedTotalRub: 7.2,
      },
    );

    await wrapper.get('[data-test="reconfirm"]').trigger("click");
    expect(reconfirm).toHaveBeenCalledWith({
      accessToken: "access-token",
      cartItems: expect.any(Array),
    });
  });

  it("показывает недоступные позиции и сообщение общей ошибки", async () => {
    const { checkout, wrapper } = await mountPage();
    checkout.status = checkoutStatuses.error;
    checkout.errorMessage = "Не удалось оформить заказ";
    checkout.unavailableCartItemIds = ["item"];
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: "CartScreen" }).props()).toMatchObject(
      {
        checkoutState: checkoutStatuses.error,
        errorMessage: "Не удалось оформить заказ",
        unavailableItemIds: ["item"],
      },
    );
  });

  it("не отправляет заказ, когда приём закрыт", async () => {
    const { checkout, menu, session, wrapper } = await mountPage();
    authenticate(session);
    menu.menu = { acceptsNewOrders: false, categories: [] };
    const reconfirm = vi.spyOn(checkout, "reconfirm");
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: "CartScreen" }).props()).toMatchObject(
      {
        acceptsNewOrders: false,
        checkoutState: checkoutStatuses.idle,
        errorMessage: "Приём новых заказов сейчас закрыт.",
      },
    );
    await wrapper.get('[data-test="checkout"]').trigger("click");
    await wrapper.get('[data-test="reconfirm"]').trigger("click");
    expect(createOrder).not.toHaveBeenCalled();
    expect(reconfirm).not.toHaveBeenCalled();

    checkout.status = checkoutStatuses.submitting;
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: "CartScreen" }).props()).toMatchObject(
      {
        acceptsNewOrders: false,
        checkoutState: checkoutStatuses.submitting,
      },
    );
  });
});

async function mountPage(repeatWarnings: RepeatWarning[] = []) {
  const cart = useCartStore();
  cart.items = [createCartItem()];
  cart.applyRepeat([], repeatWarnings);
  const checkout = useCheckoutStore();
  const menu = useMenuStore();
  const session = useSessionStore();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: CartPage, path: "/cart" },
      { component: CartPage, path: "/auth/phone" },
      { component: { template: "<main />" }, path: "/menu" },
      { component: CartPage, path: "/orders/:id" },
    ],
  });
  await router.push("/cart");
  await router.isReady();
  const wrapper = mount(
    { components: { RouterView }, template: "<RouterView />" },
    { global: { plugins: [router] } },
  );

  return { cart, checkout, menu, router, session, wrapper };
}

function authenticate(session: ReturnType<typeof useSessionStore>): void {
  session.status = "authenticated";
  session.accessToken = "access-token";
}

function createCartItem() {
  return {
    addons: [],
    id: "item",
    lineTotalMinor: 400,
    lineTotalRub: 4,
    productId: "00000000-0000-4000-8000-000000000001",
    productName: "Капучино",
    quantity: 1,
    selectedModifierOptions: [],
    selectedVariant: {
      id: "00000000-0000-4000-8000-000000000002",
      priceMinor: 400,
      size: "M" as const,
    },
    size: "M" as const,
    sizePrice: 4,
    type: "DRINK" as const,
    unitTotalMinor: 400,
  };
}

function createRepeatWarning() {
  return {
    context: "Размер S, Овсяное молоко",
    productName: "Капучино",
    reason: "Товар больше недоступен.",
  };
}

function createOrderResult() {
  return {
    id: "00000000-0000-4000-8000-000000000003",
    items: [
      {
        lineTotalMinor: 400,
        modifiers: [],
        productId: "00000000-0000-4000-8000-000000000001",
        productName: "Капучино",
        quantity: 1,
        size: "M" as const,
        unitTotalMinor: 400,
        variantId: "00000000-0000-4000-8000-000000000002",
      },
    ],
    number: "1042",
    stage: "CREATED" as const,
    totalMinor: 400,
  };
}
