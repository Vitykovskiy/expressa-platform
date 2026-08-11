import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setSessionDependencies } from "../app/session.store.dependencies";
import type { SessionDependencies } from "../app/session.store.types";
import AuthPhonePage from "./AuthPhonePage.vue";

vi.mock("@/features/auth/AuthScreen.vue", () => ({
  default: {
    emits: ["sendCode", "updatePhone"],
    template:
      '<button data-test="phone" @click="$emit(\'updatePhone\', \'+79991234567\')" /><button data-test="send" @click="$emit(\'sendCode\')" />',
  },
}));

describe("AuthPhonePage", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("navigates to code with a safe returnTo after OTP request", async () => {
    setSessionDependencies(createDependencies());
    const router = createTestRouter();
    await router.push("/auth/phone?returnTo=/cart");
    await router.isReady();
    const wrapper = mount(AuthPhonePage, { global: { plugins: [router] } });

    await wrapper.get('[data-test="phone"]').trigger("click");
    await wrapper.get('[data-test="send"]').trigger("click");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe("/auth/code"),
    );

    expect(router.currentRoute.value.query.returnTo).toBe("/cart");
  });

  it.each(["/auth/phone?next=/cart", "/auth/code#step", "//evil.test"])(
    "drops unsafe auth returnTo %s",
    async (returnTo) => {
      setSessionDependencies(createDependencies());
      const router = createTestRouter();
      await router.push(`/auth/phone?returnTo=${encodeURIComponent(returnTo)}`);
      await router.isReady();
      const wrapper = mount(AuthPhonePage, { global: { plugins: [router] } });

      await wrapper.get('[data-test="phone"]').trigger("click");
      await wrapper.get('[data-test="send"]').trigger("click");
      await vi.waitFor(() =>
        expect(router.currentRoute.value.path).toBe("/auth/code"),
      );
      expect(router.currentRoute.value.query.returnTo).toBeUndefined();
    },
  );
});

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: AuthPhonePage, path: "/auth/phone" },
      { component: AuthPhonePage, path: "/auth/code" },
    ],
  });
}

function createDependencies(): SessionDependencies {
  return {
    authApi: {
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
      requestOtp: vi.fn().mockResolvedValue({
        expiresInSeconds: 300,
        retryAfterSeconds: 60,
      }),
      verifyOtp: vi.fn(),
    },
    now: vi.fn(() => 1_000),
  };
}
