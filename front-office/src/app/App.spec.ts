/* eslint-disable vue/one-component-per-file -- route probes are local to App bridge tests. */
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import MenuPage from "../pages/MenuPage.vue";
import { useCartStore } from "@/entities/customer/model/cart.store";
import { setMenuStoreDependencies } from "@/entities/customer/model/menu.store.dependencies";
import CustomerShell from "@/widgets/customer-shell/CustomerShell.vue";
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
    expect(wrapper.findAllComponents(CustomerShell)).toHaveLength(1);
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

    wrapper.getComponent(CustomerShell).vm.$emit("signOut");
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

    wrapper.getComponent(CustomerShell).vm.$emit("signOut");
    await flushPromises();

    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);
    expect(sessionStore.errorMessage).toBe("Сеть недоступна");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("сопоставляет route, account и cart со свойствами единственного shell", async () => {
    const router = await createTestRouter("/");
    const cartStore = useCartStore();
    const sessionStore = useSessionStore();
    cartStore.items = [createCartItem()];
    sessionStore.setAuthenticated("+79990000000");
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    expect(shell.props()).toMatchObject({
      accountLabel: "+79990000000",
      activeDestination: "menu",
      cartCount: 1,
      isAuthenticated: true,
      showBack: false,
    });

    for (const [path, activeDestination, showBack] of [
      ["/cart", "cart", false],
      ["/auth/phone", "auth", false],
      ["/auth/code", "auth", false],
      ["/orders", "orders", false],
      ["/orders/order-1", "orders", true],
    ] as const) {
      await router.push(path);
      await flushPromises();
      expect(shell.props("activeDestination")).toBe(activeDestination);
      expect(shell.props("showBack")).toBe(showBack);
    }
  });

  it("выполняет navigation и detail back через существующие router paths", async () => {
    const router = await createTestRouter("/orders/order-1");
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    shell.vm.$emit("back");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/orders");

    shell.vm.$emit("navigate", "cart");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/cart");

    shell.vm.$emit("navigate", "auth");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/auth/phone");
    expect(router.currentRoute.value.query.returnTo).toBe("/cart");

    shell.vm.$emit("navigate", "menu");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("передаёт bridge только MenuPage и принимает только актуальный ack", async () => {
    const router = await createBridgeRouter("/");
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const wrapper = mount(App, {
      global: { plugins: [vuetify, pinia, router] },
    });
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    const menu = wrapper.getComponent(MenuBridgeProbe);
    expect(wrapper.findAll('[data-test="menu-route"]')).toHaveLength(1);
    shell.vm.$emit("selectCategory", "coffee");
    await flushPromises();
    expect(menu.props("menuShellCommand")).toMatchObject({
      requestId: 1,
      target: { id: "category", categoryId: "coffee" },
    });

    menu.vm.$emit("menuScreenChange", {
      id: "category",
      categoryId: "coffee",
    });
    menu.vm.$emit("menuShellCommandAck", 1);
    await flushPromises();
    expect(shell.props("selectedCategoryId")).toBe("coffee");
    expect(shell.props("showBack")).toBe(true);
    expect(menu.props("menuShellCommand")).toBeNull();

    shell.vm.$emit("selectCategory", "coffee");
    await flushPromises();
    menu.vm.$emit("menuShellCommandAck", 1);
    await flushPromises();
    expect(menu.props("menuShellCommand")).toMatchObject({ requestId: 2 });
    menu.vm.$emit("menuShellCommandAck", 2);
    await flushPromises();
    expect(menu.props("menuShellCommand")).toBeNull();

    shell.vm.$emit("navigate", "menu");
    await flushPromises();
    expect(menu.props("menuShellCommand")).toMatchObject({
      requestId: 3,
      target: { id: "root" },
    });

    await router.push("/cart");
    await flushPromises();
    expect(wrapper.findAll('[data-test="plain-route"]')).toHaveLength(1);
    expect(wrapper.get('[data-test="plain-route"]').text()).toBe("cart");
    expect(shell.props("selectedCategoryId")).toBeUndefined();
    expect(shell.props("showBack")).toBe(false);

    shell.vm.$emit("selectCategory", "coffee");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/");
    expect(
      wrapper.getComponent(MenuBridgeProbe).props("menuShellCommand"),
    ).toMatchObject({
      requestId: 4,
      target: { id: "category", categoryId: "coffee" },
    });

    for (const path of [
      "/cart",
      "/auth/phone",
      "/auth/code",
      "/orders",
      "/orders/order-1",
    ]) {
      await router.push(path);
      await flushPromises();
      expect(wrapper.get('[data-test="plain-route"]').text()).not.toBe("");
    }

    expect(consoleWarn.mock.calls.join(" ")).not.toMatch(
      /Extraneous non-props attributes|Extraneous non-emits event listeners/,
    );
    consoleWarn.mockRestore();
  });
});

async function createTestRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: MenuPage },
      { path: "/cart", component: MenuPage },
      { path: "/auth/phone", component: MenuPage },
      { path: "/auth/code", component: MenuPage },
      { path: "/orders", component: MenuPage },
      { path: "/orders/:id", component: MenuPage },
    ],
  });

  await router.push(path);
  await router.isReady();

  return router;
}

const MenuBridgeProbe = defineComponent({
  name: "MenuBridgeProbe",
  props: { menuShellCommand: { default: null, type: Object } },
  emits: ["menuScreenChange", "menuShellCommandAck"],
  template: '<main data-test="menu-route">menu</main>',
});

const PlainRouteProbe = defineComponent({
  name: "PlainRouteProbe",
  template: '<main data-test="plain-route">{{ $route.meta.label }}</main>',
});

async function createBridgeRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: MenuBridgeProbe, path: "/" },
      { component: PlainRouteProbe, meta: { label: "cart" }, path: "/cart" },
      {
        component: PlainRouteProbe,
        meta: { label: "auth phone" },
        path: "/auth/phone",
      },
      {
        component: PlainRouteProbe,
        meta: { label: "auth code" },
        path: "/auth/code",
      },
      {
        component: PlainRouteProbe,
        meta: { label: "orders" },
        path: "/orders",
      },
      {
        component: PlainRouteProbe,
        meta: { label: "order" },
        path: "/orders/:id",
      },
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
