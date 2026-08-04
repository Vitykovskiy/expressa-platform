import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";

import App from "./App.vue";
import { useAppStore } from "./app.store";
import { vuetify } from "./plugins";
import { createBackOfficeRouter } from "./router";
import { routePaths } from "./router.constants";
import { setSessionStoreDependencies } from "./session.store.dependencies";
import { useSessionStore } from "./session.store";
import ErrorNotice from "../shared/ui/ErrorNotice.vue";

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect(): void {}

  observe(): void {
    void this.callback;
  }

  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

const authApi = {
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
};

beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
  setSessionStoreDependencies({ authApi });
  vi.resetAllMocks();
});

describe("App", () => {
  it("после guard показывает рабочую оболочку только сотруднику", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    authenticate(pinia);
    const router = createRouter();
    const wrapper = mountApp(pinia, router);

    await router.replace(routePaths.queue);
    await router.isReady();

    expect(wrapper.text()).toContain("Очередь");
    expect(wrapper.text()).toContain("Доступность");
    expect(wrapper.text()).not.toContain("Меню");
  });

  it("после успешного logout открывает вход", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    authenticate(pinia);
    authApi.logout.mockResolvedValue(undefined);
    const router = createRouter();
    const wrapper = mountApp(pinia, router);

    await router.replace(routePaths.queue);
    await router.isReady();
    await wrapper.get(".side-nav-logout").trigger("click");
    expect(useSessionStore(pinia).status).toBe("anonymous");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(routePaths.login);
  });

  it("при ошибке logout сохраняет рабочую сессию и маршрут", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    authenticate(pinia);
    authApi.logout.mockRejectedValue(new Error("network"));
    const router = createRouter();
    const wrapper = mountApp(pinia, router);

    await router.replace(routePaths.queue);
    await router.isReady();
    await wrapper.get(".side-nav-logout").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe(routePaths.queue);
    expect(useSessionStore(pinia).status).toBe("authenticated");
  });

  it("показывает и закрывает ошибку состояния экрана", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    authenticate(pinia);
    const router = createRouter();
    const wrapper = mountApp(pinia, router);
    const appStore = useAppStore(pinia);
    appStore.showScreenError({
      message: "Изменение не принято.",
      requestId: "request-42",
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Изменение не принято.");
    wrapper.getComponent(ErrorNotice).vm.$emit("close");

    expect(appStore.screenError).toBeNull();
  });
});

function authenticate(pinia: ReturnType<typeof createPinia>): void {
  useSessionStore(pinia).$patch({
    accessToken: "access-token",
    currentUser: { id: "staff-id", phoneE164: "+79123456789", role: "barista" },
    error: null,
    status: "authenticated",
  });
}

function createRouter() {
  return createBackOfficeRouter({ history: createMemoryHistory() });
}

function mountApp(
  pinia: ReturnType<typeof createPinia>,
  router: ReturnType<typeof createRouter>,
) {
  return mount(App, {
    global: {
      plugins: [pinia, vuetify, router],
    },
  });
}
