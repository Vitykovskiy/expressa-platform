import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "@/app/session.store";
import { apiClientKey } from "@/shared/api/client";
import OrderNotificationsSection from "./OrderNotificationsSection.vue";

describe("OrderNotificationsSection", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "serviceWorker");
    Reflect.deleteProperty(window, "PushManager");
    Reflect.deleteProperty(window, "Notification");
  });

  it("не показывает invitation при отсутствии поддержки, оставляя объяснение в Settings", async () => {
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: {
            props: ["modelValue"],
            template: '<section v-if="modelValue"><slot /></section>',
          },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find("#notifications").exists()).toBe(false);
    wrapper.vm.openSettings();
    await flushPromises();
    expect(wrapper.text()).toContain(
      "Уведомления не поддерживаются этим браузером.",
    );
  });

  it("не показывает invitation при запрещённых уведомлениях", async () => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "denied" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: new Promise(() => undefined) },
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: {
            props: ["modelValue"],
            template: '<section v-if="modelValue"><slot /></section>',
          },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find("#notifications").exists()).toBe(false);
    wrapper.vm.openSettings();
    await flushPromises();
    expect(wrapper.text()).toContain("Уведомления заблокированы");
  });

  it("не оставляет проверку бесконечной, если readiness service worker не отвечает", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "default" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { ready: new Promise(() => undefined) },
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: {
            props: ["modelValue"],
            template: '<section v-if="modelValue"><slot /></section>',
          },
        },
      },
    });

    expect(wrapper.find("#notifications").exists()).toBe(false);
    wrapper.vm.openSettings();
    await flushPromises();
    expect(wrapper.text()).toContain("Проверяем уведомления…");
    await vi.advanceTimersByTimeAsync(5_000);
    await flushPromises();

    expect(wrapper.text()).toContain(
      "Не удалось проверить уведомления. Попробуйте ещё раз.",
    );
    expect(wrapper.text()).toContain("Повторить проверку");
  });

  it("не заявляет о включённых уведомлениях без подписки", async () => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: () => Promise.resolve(null) },
        }),
      },
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: {
            props: ["modelValue"],
            template:
              '<section v-if="modelValue" data-testid="settings"><slot /></section>',
          },
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Включить уведомления");
    expect(wrapper.text()).not.toContain("Уведомления включены.");
  });

  it("открывает единые настройки с управлением уведомлениями", async () => {
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiDialog: {
            props: ["modelValue"],
            template:
              '<section v-if="modelValue" data-testid="settings"><slot /></section>',
          },
        },
      },
    });
    await flushPromises();

    wrapper.vm.openSettings();
    await nextTick();

    expect(wrapper.get('[data-testid="settings"]').text()).toContain(
      "Уведомления о заказах",
    );
  });

  it("явно закрывает настройки без выхода из аккаунта и открывает их снова", async () => {
    useSessionStore().$patch({ status: "authenticated" });
    const DialogStub = defineComponent({
      name: "VDialog",
      props: { modelValue: Boolean },
      emits: ["afterLeave", "update:modelValue"],
      template:
        '<section v-if="modelValue" data-testid="settings"><slot /></section>',
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        stubs: {
          UiBtn: { template: "<button><slot /></button>" },
          UiIconBtn: {
            template:
              '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          VDialog: DialogStub,
        },
      },
    });
    await flushPromises();

    wrapper.vm.openSettings();
    await nextTick();

    expect(wrapper.get('[data-testid="settings"]').text()).toContain(
      "Выйти из аккаунта",
    );
    expect(wrapper.get('[aria-label="Закрыть настройки"]').classes()).toContain(
      "order-notifications__settings-close",
    );
    await wrapper.get('[aria-label="Закрыть настройки"]').trigger("click");

    expect(wrapper.find('[data-testid="settings"]').exists()).toBe(false);
    expect(wrapper.emitted("signOut")).toBeUndefined();
    wrapper.getComponent(DialogStub).vm.$emit("afterLeave");
    await nextTick();

    wrapper.vm.openSettings();
    await nextTick();

    expect(wrapper.get('[data-testid="settings"]').text()).toContain(
      "Выйти из аккаунта",
    );
  });

  it("не возвращает invitation при ошибке отключения включённых уведомлений", async () => {
    const subscription = {
      endpoint: "https://push.example.test/subscription",
      getKey: () => new Uint8Array([1]).buffer,
      unsubscribe: vi.fn(),
    };
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: { permission: "granted" },
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(subscription),
          },
        }),
      },
    });
    useSessionStore().$patch({
      accessToken: "access",
      status: "authenticated",
    });
    const wrapper = mount(OrderNotificationsSection, {
      global: {
        provide: {
          [apiClientKey as symbol]: {
            request: vi.fn().mockRejectedValue(new Error("network")),
          },
        },
        stubs: {
          UiBtn: {
            template: "<button @click=\"$emit('click')\"><slot /></button>",
          },
          UiDialog: {
            props: ["modelValue"],
            template:
              '<section v-if="modelValue" data-testid="settings"><slot /></section>',
          },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find("#notifications").exists()).toBe(false);
    wrapper.vm.openSettings();
    await nextTick();
    await wrapper
      .get('[data-testid="settings"] button:not([aria-label])')
      .trigger("click");
    await flushPromises();

    expect(wrapper.find("#notifications").exists()).toBe(false);
    expect(wrapper.get('[data-testid="settings"]').text()).toContain(
      "Не удалось изменить настройки уведомлений",
    );
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });
});
