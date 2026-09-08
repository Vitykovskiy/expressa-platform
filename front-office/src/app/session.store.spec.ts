import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/customer/model/cart.store";
import { ApiError, createApiClient } from "../shared/api/client";
import {
  configureSessionDependencies,
  getSessionDependencies,
  setSessionDependencies,
} from "./session.store.dependencies";
import { useSessionStore } from "./session.store";
import type { CurrentUser, SessionDependencies } from "./session.store.types";

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("uses one refresh for concurrent bootstrap and keeps token only in memory", async () => {
    const dependencies = createDependencies();
    const resolveRefresh = createDeferred<typeof accessSession>();
    dependencies.authApi.refresh = vi.fn(() => resolveRefresh.promise);
    setSessionDependencies(dependencies);
    const store = useSessionStore();

    const first = store.bootstrap();
    const second = store.bootstrap();
    resolveRefresh.resolve(accessSession);
    await Promise.all([first, second]);

    expect(dependencies.authApi.refresh).toHaveBeenCalledTimes(1);
    expect(store.accessToken).toBe(accessSession.accessToken);
    expect(store.currentUser).toEqual(customer);
  });

  it("turns 401 refresh into anonymous and keeps other failures recoverable", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.refresh = vi.fn().mockRejectedValue(apiError(401));
    setSessionDependencies(dependencies);
    await useSessionStore().bootstrap();
    expect(useSessionStore().status).toBe("anonymous");

    dependencies.authApi.refresh = vi.fn().mockRejectedValue(apiError(500));
    await useSessionStore().bootstrap();
    expect(useSessionStore().status).toBe("unknown");
    expect(useSessionStore().errorMessage).toBe(
      "Не удалось восстановить сессию. Попробуйте ещё раз.",
    );
  });

  it("permits only one in-flight logout and releases it after rejection", async () => {
    const dependencies = createDependencies();
    const deferred = createDeferred<void>();
    dependencies.authApi.logout = vi.fn(() => deferred.promise);
    setSessionDependencies(dependencies);
    const store = useSessionStore();
    store.setAuthenticated("+79991234567");

    const first = store.logout();
    const second = store.logout();
    expect(dependencies.authApi.logout).toHaveBeenCalledTimes(1);

    deferred.reject(apiError(503));
    await expect(first).rejects.toThrow("Ошибка API");
    await expect(second).rejects.toThrow("Ошибка API");
    expect(store.status).toBe("authenticated");

    dependencies.authApi.logout = vi.fn().mockResolvedValue(undefined);
    await store.logout();
    expect(dependencies.authApi.logout).toHaveBeenCalledTimes(1);
    expect(store.status).toBe("anonymous");
  });

  it("rejects a non-customer session", async () => {
    const dependencies = createDependencies({ ...customer, role: "barista" });
    setSessionDependencies(dependencies);

    await expect(
      useSessionStore().verifyOtp("+79991234567", "123456"),
    ).rejects.toThrow("Эта учётная запись не является клиентской.");

    expect(useSessionStore().status).toBe("anonymous");
    expect(useSessionStore().accessToken).toBeNull();
  });

  it("clears cart only after successful logout", async () => {
    const dependencies = createDependencies();
    setSessionDependencies(dependencies);
    const cart = useCartStore();
    cart.replace([], createStorage());
    cart.items = [cartItem];
    const store = useSessionStore();
    store.setAuthenticated("+79991234567");

    await store.logout();
    expect(cart.items).toEqual([]);

    cart.items = [cartItem];
    store.setAuthenticated("+79991234567");
    dependencies.authApi.logout = vi.fn().mockRejectedValue(apiError(500));
    await expect(store.logout()).rejects.toThrow("Ошибка API");
    expect(cart.items).toEqual([cartItem]);
    expect(store.status).toBe("authenticated");
  });

  it("records one absolute OTP expiry and clears it after verification", async () => {
    const dependencies = createDependencies();
    dependencies.now = vi.fn(() => 1_000);
    dependencies.authApi.requestOtp = vi.fn().mockResolvedValue({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });
    setSessionDependencies(dependencies);
    const store = useSessionStore();

    await store.requestOtp("+79991234567");

    expect(store.otpRequestedAt).toBe(1_000);
    expect(store.otpExpiresAt).toBe(301_000);
    await store.verifyOtp("+79991234567", "123456");
    expect(store.otpExpiresAt).toBeNull();
  });

  it("показывает понятную ошибку для недействительного одноразового кода", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.verifyOtp = vi
      .fn()
      .mockRejectedValue(apiError(400, "AUTH_CODE_INVALID", "Код не принят."));
    setSessionDependencies(dependencies);

    await expect(
      useSessionStore().verifyOtp("+79991234567", "123456"),
    ).rejects.toThrow("Код не принят.");

    expect(useSessionStore().errorMessage).toBe(
      "Одноразовый код недействителен.",
    );
  });

  it("показывает понятную ошибку при ограничении повторного запроса кода", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.requestOtp = vi
      .fn()
      .mockRejectedValue(
        apiError(429, "AUTH_RATE_LIMITED", "Too many requests"),
      );
    setSessionDependencies(dependencies);

    await expect(useSessionStore().requestOtp("+79991234567")).rejects.toThrow(
      "Too many requests",
    );

    expect(useSessionStore().errorMessage).toBe(
      "Повторный запрос кода пока недоступен.",
    );
  });

  it.each([
    [400, "API_CONTRACT_ERROR", "Сервер вернул неизвестный ответ."],
    [503, "SERVICE_UNAVAILABLE", "Service unavailable"],
  ])(
    "объясняет неудачу отправки кода без технического текста: %i %s",
    async (status, code, message) => {
      const dependencies = createDependencies();
      dependencies.authApi.requestOtp = vi
        .fn()
        .mockRejectedValue(apiError(status, code, message));
      setSessionDependencies(dependencies);

      await expect(
        useSessionStore().requestOtp("+79991234567"),
      ).rejects.toThrow(message);

      expect(useSessionStore().errorMessage).toBe(
        "Не удалось отправить код. Попробуйте ещё раз.",
      );
    },
  );

  it("объясняет истёкший код и предлагает запросить новый", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.verifyOtp = vi
      .fn()
      .mockRejectedValue(apiError(400, "AUTH_CODE_EXPIRED", "Код истёк."));
    setSessionDependencies(dependencies);

    await expect(
      useSessionStore().verifyOtp("+79991234567", "123456"),
    ).rejects.toThrow("Код истёк.");

    expect(useSessionStore().errorMessage).toBe(
      "Срок действия кода истёк. Запросите новый код.",
    );
  });

  it("сохраняет резервный текст для не-API ошибки", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.verifyOtp = vi
      .fn()
      .mockRejectedValue({ code: "AUTH_CODE_INVALID" });
    setSessionDependencies(dependencies);

    await expect(
      useSessionStore().verifyOtp("+79991234567", "123456"),
    ).rejects.toEqual({ code: "AUTH_CODE_INVALID" });

    expect(useSessionStore().errorMessage).toBe(
      "Не удалось выполнить операцию сессии.",
    );
  });

  it("направляет запросы авторизации сессии на настроенный API origin", async () => {
    let requestedUrl = "";
    const apiClient = createApiClient(
      "https://api.example.test",
      async (input) => {
        requestedUrl = input.toString();

        return new Response(
          JSON.stringify({ expiresInSeconds: 300, retryAfterSeconds: 60 }),
          { status: 202 },
        );
      },
    );

    configureSessionDependencies(apiClient);

    await getSessionDependencies().authApi.requestOtp("+79991234567");

    expect(requestedUrl).toBe(
      "https://api.example.test/api/v2/auth/otp/request",
    );
  });
});

const accessSession = {
  accessToken: "memory-token",
  expiresInSeconds: 900,
  tokenType: "Bearer" as const,
};
const customer = {
  id: "customer-1",
  phoneE164: "+79991234567",
  role: "customer" as const,
};
const cartItem = {
  addons: [],
  id: "item-1",
  lineTotalRub: 300,
  productId: "product-1",
  productName: "Кофе",
  quantity: 1,
  type: "drink" as const,
};

function createDependencies(
  currentUser: CurrentUser = customer,
): SessionDependencies {
  return {
    authApi: {
      getCurrentUser: vi.fn().mockResolvedValue(currentUser),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(accessSession),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn().mockResolvedValue(accessSession),
    },
    now: vi.fn(() => 0),
  };
}

function apiError(
  status: number,
  code = "API_ERROR",
  message = "Ошибка API",
): ApiError {
  return new ApiError({
    code,
    details: null,
    message,
    requestId: null,
    status,
  });
}

function createDeferred<T>(): {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
} {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}

function createStorage() {
  return { getItem: () => null, removeItem: vi.fn(), setItem: vi.fn() };
}
