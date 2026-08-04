import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";

import { ApiError } from "../shared/api/client";

import { createNavigationItems } from "./navigation";
import { navigationDefinitions } from "./navigation.constants";
import { createBackOfficeRouter, routes } from "./router";
import { routePaths } from "./router.constants";
import { setSessionStoreDependencies } from "./session.store.dependencies";
import { useSessionStore } from "./session.store";

const authApi = {
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
};

beforeEach(() => {
  setActivePinia(createPinia());
  setSessionStoreDependencies({ authApi });
  vi.resetAllMocks();
});

describe("маршруты back-office", () => {
  it.each([
    ["barista", routePaths.queue, routePaths.queue],
    ["barista", routePaths.availability, routePaths.availability],
    ["barista", routePaths.menu, routePaths.queue],
    ["administrator", routePaths.queue, routePaths.queue],
    ["administrator", routePaths.availability, routePaths.availability],
    ["administrator", routePaths.menu, routePaths.menu],
  ] as const)(
    "пускает %s на %s по матрице ролей",
    async (role, path, expectedPath) => {
      authenticate(role);
      const router = createRouter();

      await router.push(path);
      await router.isReady();

      expect(router.currentRoute.value.path).toBe(expectedPath);
    },
  );

  it("перенаправляет анонимного сотрудника на вход", async () => {
    authApi.refresh.mockRejectedValue(
      new ApiError({
        code: "UNAUTHORIZED",
        details: null,
        message: "Unauthorized",
        requestId: null,
        status: 401,
      }),
    );
    const router = createRouter();

    await router.push(routePaths.queue);
    await router.isReady();

    expect(router.currentRoute.value.path).toBe(routePaths.login);
    expect(authApi.refresh).toHaveBeenCalledOnce();
  });

  it("не пускает customer к рабочему маршруту", async () => {
    authApi.refresh.mockResolvedValue({ accessToken: "customer-token" });
    authApi.getCurrentUser.mockResolvedValue({
      id: "customer-id",
      phoneE164: "+79123456789",
      role: "customer",
    });
    const router = createRouter();

    await router.push(routePaths.menu);
    await router.isReady();

    expect(router.currentRoute.value.path).toBe(routePaths.login);
    expect(authApi.logout).toHaveBeenCalledOnce();
  });

  it("не показывает вход уже авторизованному сотруднику", async () => {
    authenticate("barista");
    const router = createRouter();

    await router.push(routePaths.login);
    await router.isReady();

    expect(router.currentRoute.value.path).toBe(routePaths.queue);
  });

  it("строит навигацию только из доступных маршрутов", () => {
    expect(createNavigationItems("barista").map((item) => item.path)).toEqual([
      routePaths.queue,
      routePaths.availability,
    ]);
    expect(
      createNavigationItems("administrator").map((item) => item.path),
    ).toEqual([routePaths.queue, routePaths.availability, routePaths.menu]);
  });

  it("использует определения навигации для всех рабочих маршрутов", () => {
    expect(
      routes
        .filter((route) => route.meta?.requiresStaff)
        .map((route) => route.path),
    ).toEqual(Object.values(navigationDefinitions).map((item) => item.path));
  });
});

function authenticate(role: "barista" | "administrator"): void {
  useSessionStore().$patch({
    accessToken: "access-token",
    currentUser: { id: "staff-id", phoneE164: "+79123456789", role },
    error: null,
    status: "authenticated",
  });
}

function createRouter() {
  return createBackOfficeRouter({ history: createMemoryHistory() });
}
