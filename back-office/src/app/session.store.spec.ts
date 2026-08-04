import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../shared/api/client";
import { createSessionStore } from "./session.store";
import type { SessionStoreDependencies } from "./session.store.types";

function createDependencies() {
  return {
    authApi: {
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
  };
}

function createStore(dependencies = createDependencies()) {
  const useSessionStore = createSessionStore(
    dependencies as SessionStoreDependencies,
  );

  return { dependencies, store: useSessionStore(createPinia()) };
}

describe("session store", () => {
  it("передаёт запрос OTP через injected AuthApi", async () => {
    const { dependencies, store } = createStore();

    dependencies.authApi.requestOtp.mockResolvedValue({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });

    await expect(store.requestOtp("+79123456789")).resolves.toEqual({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });
    expect(dependencies.authApi.requestOtp).toHaveBeenCalledWith(
      "+79123456789",
    );
  });

  it("хранит staff session только в памяти после проверки OTP", async () => {
    const { dependencies, store } = createStore();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    dependencies.authApi.verifyOtp.mockResolvedValue({
      accessToken: "access-token",
      expiresInSeconds: 900,
    });
    dependencies.authApi.getCurrentUser.mockResolvedValue({
      id: "user-id",
      phoneE164: "+79123456789",
      role: "barista",
    });

    await store.verifyOtp("+79123456789", "123456");

    expect(store).toMatchObject({
      accessToken: "access-token",
      currentUser: { id: "user-id", role: "barista" },
      error: null,
      status: "authenticated",
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("отказывает customer, отзывает cookie и не сохраняет access token", async () => {
    const { dependencies, store } = createStore();

    dependencies.authApi.verifyOtp.mockResolvedValue({
      accessToken: "customer-token",
      expiresInSeconds: 900,
    });
    dependencies.authApi.getCurrentUser.mockResolvedValue({
      id: "customer-id",
      phoneE164: "+79123456789",
      role: "customer",
    });

    await store.verifyOtp("+79123456789", "123456");

    expect(dependencies.authApi.logout).toHaveBeenCalledOnce();
    expect(store).toMatchObject({
      accessToken: null,
      currentUser: null,
      status: "denied",
    });
  });

  it("объединяет одновременное восстановление сессии в один refresh", async () => {
    const { dependencies, store } = createStore();
    let resolveRefresh!: (value: {
      accessToken: string;
      expiresInSeconds: number;
    }) => void;

    dependencies.authApi.refresh.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    dependencies.authApi.getCurrentUser.mockResolvedValue({
      id: "user-id",
      phoneE164: "+79123456789",
      role: "administrator",
    });

    const first = store.restore();
    const second = store.restore();
    resolveRefresh({ accessToken: "restored-token", expiresInSeconds: 900 });
    await Promise.all([first, second]);

    expect(dependencies.authApi.refresh).toHaveBeenCalledOnce();
    expect(store.status).toBe("authenticated");
  });

  it("переводит 401 refresh в anonymous", async () => {
    const { dependencies, store } = createStore();

    dependencies.authApi.refresh.mockRejectedValue(
      new ApiError({
        code: "UNAUTHORIZED",
        details: null,
        message: "Unauthorized",
        requestId: null,
        status: 401,
      }),
    );

    await store.restore();

    expect(store).toMatchObject({ error: null, status: "anonymous" });
  });

  it("сохраняет явную безопасную ошибку при недоступном refresh", async () => {
    const { dependencies, store } = createStore();

    dependencies.authApi.refresh.mockRejectedValue(
      new Error("network details"),
    );

    await store.restore();

    expect(store).toMatchObject({
      error: { message: "Не удалось обновить сессию.", requestId: null },
      status: "unknown",
    });
  });

  it("очищает state только после успешного backend logout", async () => {
    const { dependencies, store } = createStore();

    dependencies.authApi.verifyOtp.mockResolvedValue({
      accessToken: "access-token",
      expiresInSeconds: 900,
    });
    dependencies.authApi.getCurrentUser.mockResolvedValue({
      id: "user-id",
      phoneE164: "+79123456789",
      role: "barista",
    });
    await store.verifyOtp("+79123456789", "123456");
    dependencies.authApi.logout.mockRejectedValue(new Error("network details"));

    await store.logout();

    expect(store).toMatchObject({
      accessToken: "access-token",
      error: { message: "Не удалось обновить сессию.", requestId: null },
      status: "authenticated",
    });
  });
});
