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
    const resolveRefresh = createDeferred();
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
    expect(useSessionStore().errorMessage).toBe("Ошибка API");
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
      "https://api.example.test/api/v1/auth/otp/request",
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

function apiError(status: number): ApiError {
  return new ApiError({
    code: "API_ERROR",
    details: null,
    message: "Ошибка API",
    requestId: null,
    status,
  });
}

function createDeferred(): {
  promise: Promise<typeof accessSession>;
  resolve: (value: typeof accessSession) => void;
} {
  let resolve!: (value: typeof accessSession) => void;
  const promise = new Promise<typeof accessSession>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function createStorage() {
  return { getItem: () => null, removeItem: vi.fn(), setItem: vi.fn() };
}
