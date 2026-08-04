import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "../customer/shared/model/cart.store";
import CartPage from "./CartPage.vue";

vi.mock("../customer/pages/checkout/CartScreen.vue", () => ({
  default: {
    emits: ["checkout"],
    template: '<button data-test="checkout" @click="$emit(\'checkout\')" />',
  },
}));

describe("CartPage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("keeps guest cart and opens phone auth for checkout", async () => {
    const cart = useCartStore();
    cart.items = [
      {
        addons: [],
        id: "item",
        lineTotalRub: 1,
        productId: "p",
        productName: "P",
        quantity: 1,
        type: "drink",
      },
    ];
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { component: CartPage, path: "/cart" },
        { component: CartPage, path: "/auth/phone" },
      ],
    });
    await router.push("/cart");
    await router.isReady();
    const wrapper = mount(CartPage, { global: { plugins: [router] } });

    await wrapper.get('[data-test="checkout"]').trigger("click");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe("/auth/phone"),
    );
    expect(router.currentRoute.value.query.returnTo).toBe("/cart");
    expect(cart.items).toHaveLength(1);
  });
});
