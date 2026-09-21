/* eslint-disable vue/one-component-per-file -- route probes are local to App bridge tests. */
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const wrappers: ReturnType<typeof mount>[] = [];

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

  afterEach(() => {
    for (const wrapper of wrappers) wrapper.unmount();
    wrappers.splice(0);
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

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );

    await vi.waitFor(() => expect(bootstrap).toHaveBeenCalledTimes(1));
    expect(restore).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["cart", "session"]);
    expect(wrapper.find("h1").exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toContain(
      "Восстанавливаем сессию",
    );
    expect(wrapper.get('[role="status"]').attributes("aria-busy")).toBe("true");

    finishBootstrap();
    await flushPromises();

    expect(wrapper.get("h1").text()).toBe("Меню");
    expect(wrapper.findAllComponents(CustomerShell)).toHaveLength(1);
  });

  it("показывает восстанавливаемую ошибку с единственным повтором", async () => {
    const router = await createTestRouter("/orders");
    const sessionStore = useSessionStore();
    const bootstrap = vi
      .spyOn(sessionStore, "bootstrap")
      .mockImplementationOnce(async () => {
        sessionStore.errorMessage =
          "Не удалось восстановить сессию. Попробуйте ещё раз.";
      })
      .mockImplementationOnce(async () => {
        sessionStore.setAuthenticated("+79990000000");
      });

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    const boundary = wrapper.get('[role="status"]');
    expect(boundary.text()).toContain("Не удалось восстановить сессию");
    expect(boundary.findAll("button")).toHaveLength(1);

    await boundary.get("button").trigger("click");
    await flushPromises();

    expect(bootstrap).toHaveBeenCalledTimes(2);
    expect(wrapper.findComponent(CustomerShell).exists()).toBe(true);
    expect(router.currentRoute.value.path).toBe("/orders");
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

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    wrapper.getComponent(CustomerShell).vm.$emit("signOut");
    wrapper.getComponent(CustomerShell).vm.$emit("signOut");
    await wrapper.vm.$nextTick();
    expect(router.currentRoute.value.path).toBe("/orders");
    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);
    expect(wrapper.getComponent(CustomerShell).props("isLogoutPending")).toBe(
      true,
    );

    finishLogout();
    await expectRoute(router, "/");

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

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    wrapper.getComponent(CustomerShell).vm.$emit("signOut");
    await flushPromises();

    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);
    expect(sessionStore.errorMessage).toBe(
      "Не удалось выполнить операцию сессии.",
    );
    expect(sessionStore.errorMessage).not.toContain("Сеть недоступна");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("сопоставляет route, account и cart со свойствами единственного shell", async () => {
    const router = await createTestRouter("/");
    const cartStore = useCartStore();
    const sessionStore = useSessionStore();
    cartStore.items = [createCartItem()];
    sessionStore.setAuthenticated("+79990000000");
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    expect(shell.props()).toMatchObject({
      accountLabel: "+79990000000",
      activeDestination: "menu",
      cartCount: 1,
      isAuthenticated: true,
    });

    for (const [path, activeDestination] of [
      ["/cart", "cart"],
      ["/auth/phone", "auth"],
      ["/auth/code", "auth"],
      ["/orders", "orders"],
      ["/orders/order-1", "orders"],
    ] as const) {
      await router.push(path);
      await flushPromises();
      expect(shell.props("activeDestination")).toBe(activeDestination);
    }
  });

  it("не выбирает раздел навигации для внешнего или невалидного auth returnTo", async () => {
    const router = await createTestRouter("/");
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();
    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    for (const returnTo of [
      "https://evil.example/orders",
      "https://evil.example/cart",
      "//evil.example/orders",
      "/auth/phone",
      "/auth/code",
    ]) {
      await router.push({
        path: "/auth/phone",
        query: { returnTo },
      });
      await flushPromises();
      expect(shell.props("activeDestination")).toBe("auth");
    }
  });

  it("выполняет navigation и detail back через существующие router paths", async () => {
    const router = await createTestRouter("/orders/order-1");
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
    await flushPromises();

    const shell = wrapper.getComponent(CustomerShell);
    await router.push("/orders");
    await expectRoute(router, "/orders");

    shell.vm.$emit("navigate", "cart");
    await expectRoute(router, "/cart");

    shell.vm.$emit("navigate", "auth");
    await expectRoute(router, "/auth/phone");
    expect(router.currentRoute.value.query.returnTo).toBe("/cart");

    shell.vm.$emit("navigate", "menu");
    await expectRoute(router, "/");
  });

  it("передаёт bridge только MenuPage и принимает только актуальный ack", async () => {
    const router = await createBridgeRouter("/");
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const wrapper = track(
      mount(App, {
        global: { plugins: [vuetify, pinia, router] },
      }),
    );
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
    expect(menu.props("menuShellCommand")).toBeNull();

    menu.vm.$emit("menuScreenChange", {
      id: "product",
      categoryId: "coffee",
      productId: "espresso",
    });
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

    shell.vm.$emit("selectCategory", "coffee");
    await expectRoute(router, "/");
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

  it("A06 opens Account through the real root-menu trigger and retries its real logout action", async () => {
    const router = await createTestRouter("/");
    const sessionStore = useSessionStore();
    const cartStore = useCartStore();
    sessionStore.setAuthenticated("+79990000000");
    cartStore.items = [createCartItem()];
    const logout = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("network detail that must not reach a customer"),
      )
      .mockResolvedValueOnce(undefined);
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
    const wrapper = track(
      mount(App, {
        global: {
          plugins: [vuetify, pinia, router],
          stubs: {
            VAlert: { template: '<p v-bind="$attrs"><slot /></p>' },
            VDialog: {
              props: ["modelValue"],
              template:
                '<div v-if="modelValue" data-test="account-dialog"><slot /></div>',
            },
          },
        },
      }),
    );
    await flushPromises();
    const trigger = wrapper.get('[aria-label="Аккаунт"]');
    await trigger.trigger("click");
    await flushPromises();
    expect(wrapper.get('[data-test="account-dialog"]')).toBeDefined();
    const logoutButton = () =>
      wrapper
        .findAll("button")
        .find((button) => button.text() === "Выйти из аккаунта");
    expect(logoutButton()).toBeDefined();
    await logoutButton()!.trigger("click");
    await flushPromises();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(sessionStore.status).toBe("authenticated");
    expect(cartStore.items).toHaveLength(1);
    expect(wrapper.text()).toContain(
      "Не удалось выйти из аккаунта. Попробуйте ещё раз.",
    );
    expect(wrapper.text()).not.toContain("network detail");
    await logoutButton()!.trigger("click");
    await expectRoute(router, "/");
    expect(logout).toHaveBeenCalledTimes(2);
    expect(sessionStore.status).toBe("anonymous");
    expect(cartStore.items).toHaveLength(0);
  });

  it("A07 keeps Account closed when deferred logout settles after the customer closes it", async () => {
    const router = await createTestRouter("/");
    const sessionStore = useSessionStore();
    sessionStore.setAuthenticated("+79990000000");
    const logoutGate = deferred<void>();
    const logout = vi.fn(() => logoutGate.promise);
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
    const wrapper = track(
      mount(App, {
        global: {
          plugins: [vuetify, pinia, router],
          stubs: {
            VDialog: {
              props: ["modelValue"],
              template:
                '<div v-if="modelValue" data-test="account-dialog"><slot /></div>',
            },
            VAlert: { template: "<p><slot /></p>" },
          },
        },
      }),
    );
    await flushPromises();
    await wrapper.get('[aria-label="Аккаунт"]').trigger("click");
    await flushPromises();
    await byButtonText(wrapper, "Выйти из аккаунта").trigger("click");
    await vi.waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(
      byButtonText(wrapper, "Выйти из аккаунта").attributes("disabled"),
    ).toBeDefined();
    await wrapper
      .get('[aria-label="Закрыть настройки аккаунта"]')
      .trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find('[data-test="account-dialog"]').exists()).toBe(false),
    );

    logoutGate.resolve();
    await expectRoute(router, "/");
    expect(sessionStore.status).toBe("anonymous");
    expect(wrapper.find('[data-test="account-dialog"]').exists()).toBe(false);
  });

  it("keeps header Account available across MenuFlow root/category/product/root", async () => {
    const router = await createTestRouter("/");
    setMenuStoreDependencies({
      publicMenuApi: {
        getMenu: vi.fn().mockResolvedValue({
          acceptsNewOrders: true,
          categories: [
            {
              id: "coffee",
              name: "Кофе",
              description: "",
              products: [
                {
                  id: "espresso",
                  name: "Эспрессо",
                  description: "",
                  isAvailable: true,
                  modifierGroups: [],
                  price: null,
                  portionLabel: null,
                  priceChoices: [
                    {
                      id: "s",
                      portionLabel: "250 мл",
                      price: 180,
                      isAvailable: true,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      },
    });
    const sessionStore = useSessionStore();
    vi.spyOn(sessionStore, "bootstrap").mockResolvedValue();
    const wrapper = track(
      mount(App, {
        global: {
          plugins: [vuetify, pinia, router],
          stubs: {
            VDialog: {
              props: ["modelValue"],
              template:
                '<div v-if="modelValue" data-test="account-dialog"><slot /></div>',
            },
            VAlert: { template: "<p><slot /></p>" },
          },
        },
      }),
    );
    await vi.waitFor(() =>
      expect(wrapper.find(".menu-root__category-card").exists()).toBe(true),
    );
    await wrapper.get(".menu-root__category-card").trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find(".product-card").exists()).toBe(true),
    );
    await wrapper.get(".product-card").trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find(".product-detail").exists()).toBe(true),
    );
    await wrapper.get('.product-detail [aria-label="Назад"]').trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find(".menu-group").exists()).toBe(true),
    );
    await wrapper.get('.menu-group [aria-label="Назад"]').trigger("click");
    await vi.waitFor(() =>
      expect(wrapper.find(".menu-root").exists()).toBe(true),
    );
    await wrapper.get('[aria-label="Аккаунт"]').trigger("click");
    expect(wrapper.findAll('[data-test="account-dialog"]')).toHaveLength(1);
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
    lineTotal: 1,
    lineTotalRub: 1,
    price: 1,
    productId: "product",
    productName: "Напиток",
    portionLabel: "250 мл",
    quantity: 1,
    selectedModifierOptions: [],
    selectedPriceChoice: { id: "choice", portionLabel: "250 мл", price: 1 },
    type: "PRICED" as const,
    unitTotal: 1,
  };
}

function byButtonText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll("button").find((item) => item.text() === text);
  expect(button, `Expected button ${text}`).toBeDefined();
  return button!;
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, reject, resolve };
}

function track<T>(wrapper: T): T {
  // App permanently mounts a Vuetify dialog whose router guard must be removed
  // with the wrapper. Keeping the test lifecycle explicit prevents guard leaks.
  wrappers.push(wrapper as ReturnType<typeof mount>);
  return wrapper;
}

async function expectRoute(
  router: ReturnType<typeof createRouter>,
  path: string,
): Promise<void> {
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path));
}
