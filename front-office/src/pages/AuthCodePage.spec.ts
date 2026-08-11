import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSessionDependencies } from "../app/session.store.dependencies";
import { useSessionStore } from "../app/session.store";
import type { SessionDependencies } from "../app/session.store.types";
import AuthCodePage from "./AuthCodePage.vue";

vi.mock("@/features/auth/AuthScreen.vue", () => ({
  default: {
    emits: ["sendCode", "verifyOtp"],
    template:
      '<button data-test="resend" @click="$emit(\'sendCode\')" /><button data-test="verify" @click="$emit(\'verifyOtp\', \'123456\')" />',
  },
}));

describe("AuthCodePage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it.each([null, 1_000])(
    "redirects missing or expired OTP request (%s)",
    async (otpExpiresAt) => {
      const dependencies = createDependencies();
      setSessionDependencies(dependencies);
      const store = useSessionStore();
      store.pendingPhone = "+79991234567";
      store.otpExpiresAt = otpExpiresAt;
      const router = createTestRouter();
      await router.push("/auth/code?returnTo=/cart");
      await router.isReady();
      mount(AuthCodePage, { global: { plugins: [router] } });

      await vi.waitFor(() =>
        expect(router.currentRoute.value.path).toBe("/auth/phone"),
      );
      expect(router.currentRoute.value.query.reason).toBe("expired");
    },
  );

  it("keeps wrong OTP and resends", async () => {
    const dependencies = createDependencies();
    dependencies.authApi.verifyOtp = vi
      .fn()
      .mockRejectedValueOnce(new Error("Неверный код"));
    dependencies.authApi.requestOtp = vi.fn().mockResolvedValue({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });
    setSessionDependencies(dependencies);
    const store = useSessionStore();
    store.pendingPhone = "+79991234567";
    store.otpExpiresAt = 2_000;
    const router = createTestRouter();
    await router.push("/auth/code?returnTo=/cart");
    await router.isReady();
    const wrapper = mount(AuthCodePage, { global: { plugins: [router] } });

    await wrapper.get('[data-test="resend"]').trigger("click");
    await vi.waitFor(() =>
      expect(dependencies.authApi.requestOtp).toHaveBeenCalledWith(
        "+79991234567",
      ),
    );
    await wrapper.get('[data-test="verify"]').trigger("click");
    await vi.waitFor(() => expect(store.errorMessage).toBe("Неверный код"));
    await nextTick();
    expect(router.currentRoute.value.path).toBe("/auth/code");
  });

  it.each([
    ["/cart", "/cart"],
    ["/auth/phone?next=/cart", "/"],
    ["/auth/code#step", "/"],
    ["//evil.test", "/"],
  ])("navigates only to safe returnTo %s", async (returnTo, expectedPath) => {
    const dependencies = createDependencies();
    dependencies.authApi.verifyOtp = vi.fn().mockResolvedValue({
      accessToken: "token",
      expiresInSeconds: 900,
      tokenType: "Bearer",
    });
    dependencies.authApi.getCurrentUser = vi.fn().mockResolvedValue({
      id: "customer",
      phoneE164: "+79991234567",
      role: "customer",
    });
    setSessionDependencies(dependencies);
    const store = useSessionStore();
    store.pendingPhone = "+79991234567";
    store.otpExpiresAt = 2_000;
    const router = createTestRouter();
    await router.push(`/auth/code?returnTo=${encodeURIComponent(returnTo)}`);
    await router.isReady();
    const wrapper = mount(AuthCodePage, { global: { plugins: [router] } });

    await wrapper.get('[data-test="verify"]').trigger("click");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe(expectedPath),
    );
  });
});

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: AuthCodePage, path: "/auth/code" },
      { component: AuthCodePage, path: "/auth/phone" },
      { component: AuthCodePage, path: "/cart" },
    ],
  });
}

function createDependencies(): SessionDependencies {
  return {
    authApi: {
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
    now: vi.fn(() => 1_000),
  };
}
