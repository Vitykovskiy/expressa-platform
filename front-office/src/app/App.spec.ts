import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import MenuPage from "../pages/MenuPage.vue";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { setMenuStoreDependencies } from "@/entities/customer/model/menu.store.dependencies";
import App from "./App.vue";
import { vuetify } from "./plugins";
import { useSessionStore } from "./session.store";
import { setSessionDependencies } from "./session.store.dependencies";

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect(): void {}

  observe(): void {
    void this.callback;
  }

  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

describe("App", () => {
  let pinia = createPinia();

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    setMenuStoreDependencies({
      publicMenuApi: {
        getMenu: vi
          .fn()
          .mockResolvedValue({ acceptsNewOrders: true, categories: [] }),
      },
    });
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
        refresh: vi.fn(),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 1_000),
    });
  });

  it("восстанавливает корзину до сессии один раз и не показывает маршрут до завершения", async () => {
    const router = await createTestRouter("/");
    const cartStore = useCartStore();
    const sessionStore = useSessionStore();
    const calls: string[] = [];
    const restore = vi.spyOn(cartStore, "restore").mockImplementation(() => {
      calls.push("cart");
    });
    let finishBootstrap: () => void = () => {};
    const bootstrap = vi.spyOn(sessionStore, "bootstrap").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          calls.push("session");
          finishBootstrap = resolve;
        }),
    );

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });

    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalledTimes(1));
    expect(restore).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["cart", "session"]);
    expect(wrapper.find("h1").exists()).toBe(false);

    finishBootstrap();
    await flushPromises();

    expect(wrapper.get("h1").text()).toBe("Меню");
  });

  it("после успешного выхода очищает сессию и корзину, затем возвращает на главную", async () => {
    const router = await createTestRouter("/orders");
    const cartStore = useCartStore();
    const sessionStore = useSessionStore();
    sessionStore.setAuthenticated("+79990000000");
    cartStore.items = [createCartItem()];
    let finishLogout: () => void = () => {};
    const logout = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishLogout = resolve;
        }),
    );
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn(),
        logout,
        refresh: vi.fn(),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 1_000),
    });
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });
    await flushPromises();

    await wrapper.get("button").trigger("click");
    expect(router.currentRoute.value.path).toBe("/orders");
    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);

    finishLogout();
    await flushPromises();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(sessionStore.status).toBe("anonymous");
    expect(cartStore.items).toHaveLength(0);
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("при ошибке выхода сохраняет сессию и корзину, показывая ошибку", async () => {
    const router = await createTestRouter("/");
    const cartStore = useCartStore();
    const sessionStore = useSessionStore();
    sessionStore.setAuthenticated("+79990000000");
    cartStore.items = [createCartItem()];
    setSessionDependencies({
      authApi: {
        getCurrentUser: vi.fn(),
        logout: vi.fn().mockRejectedValue(new Error("Сеть недоступна")),
        refresh: vi.fn(),
        requestOtp: vi.fn(),
        verifyOtp: vi.fn(),
      },
      now: vi.fn(() => 1_000),
    });
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });
    await flushPromises();

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);
    expect(sessionStore.errorMessage).toBe("Сеть недоступна");
    expect(router.currentRoute.value.path).toBe("/");
  });
});

async function createTestRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: MenuPage },
      { path: "/orders", component: MenuPage },
    ],
  });

  await router.push(path);
  await router.isReady();

  return router;
}

function createCartItem() {
  return {
    addons: [],
    id: "item",
    lineTotalRub: 1,
    productId: "product",
    productName: "Напиток",
    quantity: 1,
    type: "drink" as const,
  };
}
