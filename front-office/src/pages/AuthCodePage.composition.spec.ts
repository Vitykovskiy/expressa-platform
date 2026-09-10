import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "../app/session.store";
import { setSessionDependencies } from "../app/session.store.dependencies";
import type {
  OtpRequestMetadata,
  SessionDependencies,
} from "../app/session.store.types";
import AuthCodePage from "./AuthCodePage.vue";

describe("AuthCodePage composition", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it.each([new Error("Слишком много запросов"), new Error("Нет сети")])(
    "сохраняет код после разрешённой неудачной повторной отправки: %s",
    async (failure) => {
      const currentTime = 61_000;
      const deferred = createDeferred<OtpRequestMetadata>();
      const dependencies = createDependencies(() => currentTime);
      dependencies.authApi.requestOtp = vi.fn(() => deferred.promise);
      setSessionDependencies(dependencies);
      const { router, store, wrapper } = await mountPage();

      await wrapper.get('[aria-label="Код из сообщения"]').setValue("123456");
      const resend = resendButton(wrapper);
      await Promise.all([resend.trigger("click"), resend.trigger("click")]);

      expect(dependencies.authApi.requestOtp).toHaveBeenCalledTimes(1);
      expect(wrapper.find('[aria-label="Код из сообщения"]').exists()).toBe(
        true,
      );

      deferred.reject(failure);
      await flushPromises();

      expect(otpInputValue(wrapper)).toBe("123456");
      expect(verifyButton(wrapper).attributes("disabled")).toBeUndefined();
      expect(store.pendingPhone).toBe("+79991234567");
      expect(router.currentRoute.value.fullPath).toBe(
        "/auth/code?returnTo=/cart",
      );
      expect(wrapper.text()).toContain(failure.message);
    },
  );

  it("после успешного повтора очищает код и начинает новое ожидание", async () => {
    const currentTime = 61_000;
    const dependencies = createDependencies(() => currentTime);
    dependencies.authApi.requestOtp = vi.fn().mockResolvedValue({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });
    setSessionDependencies(dependencies);
    const { store, wrapper } = await mountPage();

    await wrapper.get('[aria-label="Код из сообщения"]').setValue("123456");
    await resendButton(wrapper).trigger("click");
    await flushPromises();

    expect(dependencies.authApi.requestOtp).toHaveBeenCalledWith(
      "+79991234567",
    );
    expect(otpInputValue(wrapper)).toBe("");
    expect(
      wrapper
        .findAll("button")
        .map((button) => button.text())
        .includes("Отправить код ещё раз"),
    ).toBe(false);
    expect(store.otpRequestedAt).toBe(currentTime);
    expect(wrapper.text()).toContain(
      "Повторная отправка доступна через 60 сек.",
    );
  });

  it("на границе ожидания разрешает ровно один запрос и очищает таймер", async () => {
    let currentTime = 1_000;
    const dependencies = createDependencies(() => currentTime);
    setSessionDependencies(dependencies);
    const { store, wrapper } = await mountPage();

    await resendButton(wrapper).trigger("click");
    expect(dependencies.authApi.requestOtp).not.toHaveBeenCalled();

    currentTime = 61_000;
    await vi.advanceTimersByTimeAsync(1_000);
    await resendButton(wrapper).trigger("click");
    expect(dependencies.authApi.requestOtp).toHaveBeenCalledTimes(1);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(store.pendingPhone).toBe("+79991234567");
  });

  it("сохраняет неверный код в настоящей композиции", async () => {
    const dependencies = createDependencies(() => 1_000);
    dependencies.authApi.verifyOtp = vi
      .fn()
      .mockRejectedValue(new Error("Неверный код"));
    setSessionDependencies(dependencies);
    const { router, wrapper } = await mountPage();

    await wrapper.get('[aria-label="Код из сообщения"]').setValue("123456");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(otpInputValue(wrapper)).toBe("123456");
    expect(wrapper.text()).toContain("Неверный код");
    expect(router.currentRoute.value.fullPath).toBe(
      "/auth/code?returnTo=/cart",
    );
  });

  it("перенаправляет истёкший OTP-запрос через настоящую композицию", async () => {
    setSessionDependencies(createDependencies(() => 1_000));
    const { router } = await mountPage({ otpExpiresAt: 1_000 });

    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe("/auth/phone"),
    );
    expect(router.currentRoute.value.query.reason).toBe("expired");
  });

  it("после успешной проверки возвращает в безопасную корзину", async () => {
    const dependencies = createDependencies(() => 1_000);
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
    const { router, wrapper } = await mountPage();

    await wrapper.get('[aria-label="Код из сообщения"]').setValue("123456");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cart");
  });
});

async function mountPage({ otpExpiresAt = 301_000 } = {}) {
  const store = useSessionStore();
  store.pendingPhone = "+79991234567";
  store.otpExpiresAt = otpExpiresAt;
  store.otpRequestedAt = 1_000;
  store.otpRequestMetadata = { expiresInSeconds: 300, retryAfterSeconds: 60 };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: AuthCodePage, path: "/auth/code" },
      { component: AuthCodePage, path: "/auth/phone" },
      { component: { template: "<main />" }, path: "/cart" },
    ],
  });
  await router.push("/auth/code?returnTo=/cart");
  await router.isReady();
  const wrapper = mount(AuthCodePage, {
    global: { plugins: [router], stubs: compositionStubs },
  });

  return { router, store, wrapper };
}

function createDependencies(now: () => number): SessionDependencies {
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
    now: vi.fn(now),
  };
}

function createDeferred<T>() {
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });

  return { promise, reject };
}

function resendButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("button")[1];
}

function verifyButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("button")[0];
}

function otpInputValue(wrapper: ReturnType<typeof mount>) {
  return (
    wrapper.get('[aria-label="Код из сообщения"]').element as HTMLInputElement
  ).value;
}

const compositionStubs = {
  "ui-btn": {
    template: "<button v-bind='$attrs'><slot /></button>",
  },
  "ui-text-field": {
    props: ["modelValue"],
    template:
      "<input v-bind='$attrs' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />",
  },
  "v-progress-circular": { template: "<span />" },
  UiFieldMessage: { props: ["message"], template: "<p>{{ message }}</p>" },
};
