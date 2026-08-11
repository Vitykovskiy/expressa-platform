import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/customer/model/cart.store";
import { setMenuStoreDependencies } from "@/entities/customer/model/menu.store.dependencies";
import { useMenuStore } from "@/entities/customer/model/menu.store";
import MenuPage from "./MenuPage.vue";

let router = createRouter({ history: createMemoryHistory(), routes: [] });

describe("MenuPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ component: MenuPage, path: "/" }],
    });
  });

  it("после ошибки повторно загружает готовое меню", async () => {
    const readyMenu = createReadyMenu();
    const getMenu = vi
      .fn()
      .mockRejectedValueOnce(new Error("Нет меню"))
      .mockResolvedValueOnce(readyMenu);
    setMenuStoreDependencies({ publicMenuApi: { getMenu } });
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Загружаем меню");
    await vi.waitFor(() => expect(wrapper.text()).toContain("Нет меню"));
    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(getMenu).toHaveBeenCalledTimes(2);
    expect(useMenuStore().status).toBe("ready");
    expect(wrapper.find('[data-test="cart"]').text()).toContain("Корзина · 0");
  });

  it("показывает ready flow, добавляет товар и скрывает fixed корзину на product", async () => {
    setMenuStoreDependencies({
      publicMenuApi: { getMenu: vi.fn().mockResolvedValue(createReadyMenu()) },
    });
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get('[data-test="category"]').trigger("click");
    expect(wrapper.find('[data-test="cart"]').exists()).toBe(true);
    await wrapper.get('[data-test="add"]').trigger("click");

    const cart = useCartStore();
    expect(cart.itemCount).toBe(1);
    expect(cart.totalMinor).toBe(25_000);
    expect(wrapper.get('[data-test="cart"]').text()).toContain(
      "Корзина · 1 · 250",
    );
    expect(wrapper.get('[data-test="cart"]').attributes("href")).toBe("/cart");
    await wrapper.get('[data-test="product"]').trigger("click");
    expect(wrapper.find('[data-test="cart"]').exists()).toBe(false);
  });

  it("показывает empty menu", async () => {
    setMenuStoreDependencies({
      publicMenuApi: {
        getMenu: vi
          .fn()
          .mockResolvedValue({ acceptsNewOrders: true, categories: [] }),
      },
    });
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Меню пока пустое");
  });
});

async function mountPage() {
  await router.push("/");
  await router.isReady();

  return mount(MenuPage, {
    global: {
      plugins: [router],
      stubs: {
        MenuFlow: {
          emits: ["add", "changeLevel"],
          template: `<div>
            <button data-test="category" @click='$emit("changeLevel", "category")' />
            <button data-test="add" @click='$emit("add", { addons: [], lineTotalMinor: 25000, lineTotalRub: 250, productId: "cookie", productName: "Печенье", quantity: 1, selectedModifierOptions: [], type: "OTHER", unitTotalMinor: 25000 })' />
            <button data-test="product" @click='$emit("changeLevel", "product")' />
          </div>`,
        },
        UiBtn: {
          props: ["to"],
          template:
            '<a v-if="to" data-test="cart" :href="to"><slot /></a><button v-else><slot /></button>',
        },
        UiProgress: true,
      },
    },
  });
}

function createReadyMenu() {
  return {
    acceptsNewOrders: true,
    categories: [
      {
        description: "Напитки",
        id: "coffee",
        name: "Кофе",
        products: [],
      },
    ],
  };
}
