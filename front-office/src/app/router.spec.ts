import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import { customerNavigationGuard, router } from "./router";
import { useSessionStore } from "./session.store";
import { setSessionDependencies } from "./session.store.dependencies";

beforeEach(() => {
  setActivePinia(createPinia());
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

describe("маршруты front-office", () => {
  it("загружает неизвестную сессию и направляет анонима на вход", async () => {
    const sessionStore = useSessionStore();
    const bootstrap = vi
      .spyOn(sessionStore, "bootstrap")
      .mockImplementation(async () => {
        sessionStore.status = "anonymous";
      });
    const testRouter = createTestRouter();

    await testRouter.push("/orders?filter=active");
    await testRouter.isReady();

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(testRouter.currentRoute.value.path).toBe("/auth/phone");
    expect(testRouter.currentRoute.value.query.returnTo).toBe(
      "/orders?filter=active",
    );
  });

  it("направляет анонима на вход с внутренним returnTo", async () => {
    const sessionStore = useSessionStore();
    sessionStore.status = "anonymous";
    const testRouter = createTestRouter();

    await testRouter.push("/orders/8a0c5df9-a520-4d94-8912-eba5350cf4dc");
    await testRouter.isReady();

    expect(testRouter.currentRoute.value.path).toBe("/auth/phone");
    expect(testRouter.currentRoute.value.query.returnTo).toBe(
      "/orders/8a0c5df9-a520-4d94-8912-eba5350cf4dc",
    );
  });

  it("не открывает ввод кода без активного запроса и отбрасывает внешний returnTo", async () => {
    const testRouter = createTestRouter();

    await testRouter.push("/auth/code?returnTo=https%3A%2F%2Fevil.example");
    await testRouter.isReady();

    expect(testRouter.currentRoute.value.path).toBe("/auth/phone");
    expect(testRouter.currentRoute.value.query.returnTo).toBeUndefined();
  });

  it("разрешает заказ аутентифицированному клиенту", async () => {
    const sessionStore = useSessionStore();
    sessionStore.status = "authenticated";
    const testRouter = createTestRouter();

    await testRouter.push("/orders");
    await testRouter.isReady();

    expect(testRouter.currentRoute.value.path).toBe("/orders");
  });
});

function createTestRouter() {
  const testRouter = createRouter({
    history: createMemoryHistory(),
    routes: router.options.routes,
  });
  testRouter.beforeEach(customerNavigationGuard);

  return testRouter;
}
